import {invoke,isTauri} from '@tauri-apps/api/core';
import {open,save} from '@tauri-apps/plugin-dialog';

const filters=[{name:'VCE Revision Tracker progress',extensions:['json']}];

export const isDesktop=isTauri();

export const loadDesktopState=()=>invoke('desktop_load');
export const saveDesktopLocal=document=>invoke('desktop_save_local',{document});
export const syncDesktop=(document,knownModifiedMs,dirty)=>invoke('desktop_sync',{document,knownModifiedMs,dirty});
export const reloadDesktopSync=()=>invoke('desktop_reload_sync');
export const disconnectDesktopSync=()=>invoke('desktop_disconnect_sync');

export async function connectDesktopSync(document,create){
 const path=create
  ?await save({title:'Create a progress sync file',defaultPath:'vce-tracker-progress.json',filters})
  :await open({title:'Open a progress sync file',multiple:false,directory:false,filters});
 if(!path)return null;
 const jsonPath=create&&!path.toLowerCase().endsWith('.json')?path+'.json':path;
 return invoke('desktop_connect_sync',{path:jsonPath,create,document});
}

export async function exportDesktopBackup(document){
 const path=await save({title:'Save a progress backup',defaultPath:'vce-tracker-progress.json',filters});
 if(!path)return false;
 await invoke('desktop_write_backup',{path:path.toLowerCase().endsWith('.json')?path:path+'.json',document});
 return true;
}

export async function importDesktopBackup(){
 const path=await open({title:'Load a progress backup',multiple:false,directory:false,filters});
 if(!path)return null;
 return invoke('desktop_read_backup',{path});
}
