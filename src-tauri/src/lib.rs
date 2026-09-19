use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    fs,
    io::Write,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Manager};

const SNAPSHOT_INTERVAL_SECS: u64 = 6 * 60 * 60;
const SNAPSHOT_LIMIT: usize = 12;

#[derive(Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct StorageConfig {
    sync_path: Option<String>,
    sync_modified_ms: Option<u64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopState {
    document: Option<Value>,
    sync_path: Option<String>,
    sync_name: Option<String>,
    sync_modified_ms: Option<u64>,
    sync_needs_write: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SyncResult {
    status: String,
    document: Option<Value>,
    modified_ms: Option<u64>,
    name: Option<String>,
}

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_data_dir().map_err(|error| error.to_string())
}

fn progress_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join("progress.json"))
}

fn config_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join("storage-config.json"))
}

fn validate_document(value: &Value) -> Result<(), String> {
    if value.get("app").and_then(Value::as_str) != Some("vce-tracker")
        || !value.get("subjects").is_some_and(Value::is_object)
    {
        return Err("The selected file is not a VCE Revision Tracker backup.".into());
    }
    Ok(())
}

fn read_document(path: &Path) -> Result<Value, String> {
    let text = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let value: Value = serde_json::from_str(&text).map_err(|error| error.to_string())?;
    validate_document(&value)?;
    Ok(value)
}

fn read_config(app: &AppHandle) -> StorageConfig {
    config_path(app)
        .ok()
        .and_then(|path| fs::read_to_string(path).ok())
        .and_then(|text| serde_json::from_str(&text).ok())
        .unwrap_or_default()
}

fn modified_ms(path: &Path) -> Result<u64, String> {
    let duration = fs::metadata(path)
        .and_then(|metadata| metadata.modified())
        .and_then(|modified| {
            modified
                .duration_since(UNIX_EPOCH)
                .map_err(std::io::Error::other)
        })
        .map_err(|error| error.to_string())?;
    Ok(duration.as_millis().min(u128::from(u64::MAX)) as u64)
}

fn saved_at(value: &Value) -> &str {
    value.get("savedAt").and_then(Value::as_str).unwrap_or("")
}

fn atomic_write(path: &Path, bytes: &[u8]) -> Result<(), String> {
    let parent = path
        .parent()
        .ok_or("The save location has no parent folder.")?;
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    let temporary = path.with_extension("tmp");
    let previous = path.with_extension("previous");
    {
        let mut file = fs::File::create(&temporary).map_err(|error| error.to_string())?;
        file.write_all(bytes).map_err(|error| error.to_string())?;
        file.sync_all().map_err(|error| error.to_string())?;
    }
    if path.exists() {
        let _ = fs::remove_file(&previous);
        fs::rename(path, &previous).map_err(|error| error.to_string())?;
    }
    if let Err(error) = fs::rename(&temporary, path) {
        if previous.exists() {
            let _ = fs::rename(&previous, path);
        }
        return Err(error.to_string());
    }
    let _ = fs::remove_file(previous);
    Ok(())
}

fn write_json(path: &Path, value: &Value) -> Result<(), String> {
    validate_document(value)?;
    let bytes = serde_json::to_vec_pretty(value).map_err(|error| error.to_string())?;
    atomic_write(path, &bytes)
}

fn write_config(app: &AppHandle, config: &StorageConfig) -> Result<(), String> {
    let bytes = serde_json::to_vec_pretty(config).map_err(|error| error.to_string())?;
    atomic_write(&config_path(app)?, &bytes)
}

fn maybe_snapshot(app: &AppHandle, source: &Path) -> Result<(), String> {
    if !source.exists() {
        return Ok(());
    }
    let snapshots = data_dir(app)?.join("snapshots");
    fs::create_dir_all(&snapshots).map_err(|error| error.to_string())?;
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_secs();
    let mut files: Vec<_> = fs::read_dir(&snapshots)
        .map_err(|error| error.to_string())?
        .filter_map(Result::ok)
        .filter(|entry| entry.path().extension().and_then(|ext| ext.to_str()) == Some("json"))
        .collect();
    files.sort_by_key(|entry| entry.file_name());
    let newest = files
        .last()
        .and_then(|entry| entry.metadata().ok())
        .and_then(|metadata| metadata.modified().ok())
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_secs())
        .unwrap_or(0);
    if now.saturating_sub(newest) >= SNAPSHOT_INTERVAL_SECS {
        fs::copy(source, snapshots.join(format!("progress-{now}.json")))
            .map_err(|error| error.to_string())?;
        files = fs::read_dir(&snapshots)
            .map_err(|error| error.to_string())?
            .filter_map(Result::ok)
            .collect();
        files.sort_by_key(|entry| entry.file_name());
        let remove_count = files.len().saturating_sub(SNAPSHOT_LIMIT);
        for entry in files.into_iter().take(remove_count) {
            let _ = fs::remove_file(entry.path());
        }
    }
    Ok(())
}

fn file_name(path: &Path) -> Option<String> {
    path.file_name()
        .map(|name| name.to_string_lossy().into_owned())
}

fn checked_json_path(path: String) -> Result<PathBuf, String> {
    let path = PathBuf::from(path);
    if path
        .extension()
        .and_then(|ext| ext.to_str())
        .map(str::to_ascii_lowercase)
        != Some("json".into())
    {
        return Err("Choose a .json progress file.".into());
    }
    Ok(path)
}

#[tauri::command]
fn desktop_load(app: AppHandle) -> Result<DesktopState, String> {
    let local_path = progress_path(&app)?;
    let mut local = read_document(&local_path).ok();
    let mut config = read_config(&app);
    let mut needs_write = false;
    if let Some(path_text) = config.sync_path.clone() {
        let path = PathBuf::from(&path_text);
        if let (Ok(external), Ok(stamp)) = (read_document(&path), modified_ms(&path)) {
            if local
                .as_ref()
                .is_none_or(|value| saved_at(&external) > saved_at(value))
            {
                local = Some(external.clone());
                let _ = write_json(&local_path, &external);
            } else if local
                .as_ref()
                .is_some_and(|value| saved_at(value) > saved_at(&external))
            {
                needs_write = true;
            }
            config.sync_modified_ms = Some(stamp);
            let _ = write_config(&app, &config);
        }
    }
    let sync_name = config
        .sync_path
        .as_deref()
        .and_then(|path| file_name(Path::new(path)));
    Ok(DesktopState {
        document: local,
        sync_path: config.sync_path,
        sync_name,
        sync_modified_ms: config.sync_modified_ms,
        sync_needs_write: needs_write,
    })
}

#[tauri::command]
fn desktop_save_local(app: AppHandle, document: Value) -> Result<(), String> {
    let path = progress_path(&app)?;
    maybe_snapshot(&app, &path)?;
    write_json(&path, &document)
}

#[tauri::command]
fn desktop_connect_sync(
    app: AppHandle,
    path: String,
    create: bool,
    document: Value,
) -> Result<SyncResult, String> {
    let path = checked_json_path(path)?;
    let loaded = if create {
        write_json(&path, &document)?;
        None
    } else {
        Some(read_document(&path)?)
    };
    let stamp = modified_ms(&path)?;
    write_config(
        &app,
        &StorageConfig {
            sync_path: Some(path.to_string_lossy().into_owned()),
            sync_modified_ms: Some(stamp),
        },
    )?;
    Ok(SyncResult {
        status: if create { "saved" } else { "loaded" }.into(),
        document: loaded,
        modified_ms: Some(stamp),
        name: file_name(&path),
    })
}

#[tauri::command]
fn desktop_sync(
    app: AppHandle,
    document: Value,
    known_modified_ms: Option<u64>,
    dirty: bool,
) -> Result<SyncResult, String> {
    let mut config = read_config(&app);
    let path = match config.sync_path.as_deref() {
        Some(path) => PathBuf::from(path),
        None => {
            return Ok(SyncResult {
                status: "disconnected".into(),
                document: None,
                modified_ms: None,
                name: None,
            })
        }
    };
    let stamp = modified_ms(&path)?;
    if known_modified_ms != Some(stamp) {
        if dirty {
            return Ok(SyncResult {
                status: "conflict".into(),
                document: None,
                modified_ms: Some(stamp),
                name: file_name(&path),
            });
        }
        let loaded = read_document(&path)?;
        config.sync_modified_ms = Some(stamp);
        write_config(&app, &config)?;
        return Ok(SyncResult {
            status: "loaded".into(),
            document: Some(loaded),
            modified_ms: Some(stamp),
            name: file_name(&path),
        });
    }
    if dirty {
        write_json(&path, &document)?;
        let stamp = modified_ms(&path)?;
        config.sync_modified_ms = Some(stamp);
        write_config(&app, &config)?;
        return Ok(SyncResult {
            status: "saved".into(),
            document: None,
            modified_ms: Some(stamp),
            name: file_name(&path),
        });
    }
    Ok(SyncResult {
        status: "unchanged".into(),
        document: None,
        modified_ms: Some(stamp),
        name: file_name(&path),
    })
}

#[tauri::command]
fn desktop_reload_sync(app: AppHandle) -> Result<SyncResult, String> {
    let mut config = read_config(&app);
    let path = config
        .sync_path
        .as_deref()
        .map(PathBuf::from)
        .ok_or("No sync file is connected.")?;
    let document = read_document(&path)?;
    let stamp = modified_ms(&path)?;
    config.sync_modified_ms = Some(stamp);
    write_config(&app, &config)?;
    Ok(SyncResult {
        status: "loaded".into(),
        document: Some(document),
        modified_ms: Some(stamp),
        name: file_name(&path),
    })
}

#[tauri::command]
fn desktop_disconnect_sync(app: AppHandle) -> Result<(), String> {
    write_config(&app, &StorageConfig::default())
}

#[tauri::command]
fn desktop_write_backup(path: String, document: Value) -> Result<(), String> {
    write_json(&checked_json_path(path)?, &document)
}

#[tauri::command]
fn desktop_read_backup(path: String) -> Result<Value, String> {
    read_document(&checked_json_path(path)?)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            desktop_load,
            desktop_save_local,
            desktop_connect_sync,
            desktop_sync,
            desktop_reload_sync,
            desktop_disconnect_sync,
            desktop_write_backup,
            desktop_read_backup
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
