# Changelog

All notable changes to VCE Revision Tracker are documented here.

## [1.0.1] - 2026-09-21

### Changed

- Reworked all 1,509 cue cards around study-design-specific terms, definitions, and required knowledge instead of repeating practice-question prompts.
- Added a focused cue-card view with previous and next navigation, keyboard activation, Escape-to-close support, and background scroll locking.

### Compatibility

- Existing progress, subject selections, ratings, practice attempts, backups, and OneDrive sync files remain compatible.

## [1.0.0] - 2026-09-19

### Added

- Windows desktop app and per-user installer built with Tauri 2.
- Twenty-nine VCE Units 3 and 4 subjects with cue cards and practice questions.
- First-run welcome and subject-selection flow.
- Red, amber, and green self-assessment with confidence history.
- Saved practice attempts, best-mark summaries, and read-only marking guides.
- Automatic local desktop saving, recovery snapshots, JSON backups, and optional OneDrive file synchronisation.
- Four visual themes, responsive layouts, printing support, and custom fullscreen controls.

### Compatibility

- Older three-pass ratings migrate to current confidence while retaining completed ratings as history.
- Older practice answers migrate into question-level attempt history.

### Known limitations

- Windows builds are not code-signed and may show a SmartScreen warning.
- Updates must be downloaded and installed manually.
