# VCE Revision Tracker

A React and Tauri revision tracker for VCE Units 3 & 4. It helps students self-assess every key knowledge point, focus on weaker topics, practise questions, and track improvement over time.

## Subjects included

- Accounting
- Ancient History
- Applied Computing: Data Analytics
- Biology
- Business Management
- Chemistry
- Economics
- English
- English Language
- Environmental Science
- Food Studies
- General Mathematics
- Geography
- Health and Human Development
- History: Revolutions
- Legal Studies
- Literature
- Mathematical Methods
- Media
- Philosophy
- Physical Education
- Physics
- Politics
- Product Design and Technologies
- Psychology
- Sociology
- Software Development
- Specialist Mathematics
- Visual Communication Design

## Features

- Current red, amber, and green confidence tracking with rating history
- Red, amber, and green progress summaries
- Filters for unrated and weaker topics
- Study-design-specific flash cards with structured definitions and key knowledge
- Practice questions with read-only marking guides, self-marking, and saved attempt history
- Four visual themes: Glass, Poster, Midnight, and Notebook
- Automatic local progress saving
- Native desktop saving with atomic writes and rolling recovery snapshots
- JSON backup and restore for moving progress between computers
- Optional OneDrive progress-file synchronisation
- Custom Windows title bar with fullscreen controls and F11 support
- Responsive, accessible, and print-friendly design

## Downloading the Windows app

Each GitHub release provides two Windows downloads:

- **VCE Revision Tracker Setup.exe** — recommended for most users; installs the app for the current Windows account.
- **VCE Revision Tracker.exe** — portable version that can be run without installation.

The first release is not code-signed, so Windows SmartScreen may show an unknown-publisher warning. Only download release files from this repository.

## Run locally

Install Node.js 22.12+ (or Node.js 24) and run these commands from the project folder:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:5173 in your browser. Use the same address each time to retain access to browser-saved progress.

1. Download or clone this repository.
2. Install dependencies and start the development server as shown above.
3. On your first visit, choose **Self assess**, select the subjects you study, and choose **Start revising**.
4. Open a subject and choose red, amber, or green for each knowledge point.

Use **Change subjects** on the dashboard to update your selection later. Your choices are remembered locally, and dashboard totals cover only your selected subjects. Removing a subject from the dashboard keeps its saved ratings, so you can add it back later. Setup currently offers the twenty-nine subjects listed above.

Biology, Business Management, Chemistry, Economics, Legal Studies, Psychology and Specialist Mathematics were added as full-depth subjects: each has 56 to 83 paraphrased revision checkpoints covering Units 3 and 4, and every checkpoint carries one original practice question with a suggested marking guide. Their checklist numbers are internal tracker IDs, not VCAA syllabus numbering, and the practice questions are original revision exercises rather than official VCAA questions. Every subject uses the current official VCAA Unit and Area of Study names and links to its live study-design and examination-resource pages. Legal Studies and Economics cover areas where the law, policy settings and published figures change, so check current detail against VCAA and other official sources.

English, History: Revolutions, Geography, Physical Education, Accounting, Applied Computing: Data Analytics, Visual Communication Design, Media and Product Design and Technologies were added as skills-based subjects, with 36 to 59 checkpoints each and one original practice question per checkpoint. Because set texts, case studies and chosen revolutions differ between schools, many of their checkpoints ask you to apply a skill to your own texts and examples rather than testing recall of a particular one. English and English Language are separate subjects with separate saved progress.

Ancient History, Literature, Politics, Philosophy, Environmental Science, Sociology and Food Studies were added most recently. Politics follows the current study implemented for Units 3 and 4 from 2025: Unit 3 covers one global issue and one contemporary humanitarian crisis, while Unit 4 covers one selected Indo-Pacific state and Australia's relationships with three regional states. Ancient History covers Egypt, Greece and Rome alongside shared skills and thematic areas, so use the societies your class studies. Health and Human Development, which originally carried only four practice questions across its 49 checkpoints, now has a question and marking guide on every point, so every subject in the tracker is at full depth.

Progress is stored locally. Use **Save a backup file** to export your progress and **Load a backup file** to restore it later. The included `vce-tracker-progress.json` file is a compatible legacy progress backup and is migrated when imported.

## Windows desktop app

The React app is also packaged as a lightweight Windows desktop application with Tauri 2. Before building it on a new computer, install Rust and Microsoft's **Desktop development with C++** workload as described in the [Tauri Windows prerequisites](https://v2.tauri.app/start/prerequisites/).

Run the desktop app in development mode:

```powershell
npm ci
npm run app:dev
```

Build the portable executable and per-user Windows installer:

```powershell
npm run app:build
```

The finished files are copied to `desktop-build/VCE Revision Tracker.exe` and `desktop-build/VCE Revision Tracker Setup.exe`. The build also creates `desktop-build/SHA256SUMS.txt` so release downloads can be verified. Cargo's large compilation cache is kept under `%LOCALAPPDATA%\VCERevisionTracker\cargo-target` so it is not synced through OneDrive. The portable executable uses the Microsoft Edge WebView2 runtime included with current Windows 10 and Windows 11 installations.

The desktop app saves progress independently in its Windows application-data folder. Writes are staged before replacing the main progress file, and the app keeps up to twelve recovery snapshots at least six hours apart. Subject selection and theme are included alongside ratings and practice answers.

Desktop backup and OneDrive sync files use native Windows file dialogs. The selected sync path is remembered across launches. Before writing, the app checks whether OneDrive or another computer changed the file; conflicting local changes are never silently overwritten. The browser build retains its File System Access API and download/upload fallbacks.

The website and desktop app use separate local storage. To move existing progress into the desktop app, export a backup from the website and import it in the desktop app.

## Project structure

```text
index.html                   # React application entry page
src/App.jsx                  # React screens and interactive components
src/components/              # Setup, dashboard, subject and app-shell UI
src/hooks/useTrackerData.js  # Tracker state, persistence and sync orchestration
src/services/desktop-storage.js # Typed boundary for native Tauri storage commands
src/storage.js               # Saved-progress validation and backup compatibility
src/subjects/                # One file per subject: points, details, questions
src/subjects-index.json      # Generated: ids, names and point ids only
src/subject-loader.js        # Loads a subject's content when it is opened
scripts/build-subject-index.mjs  # Regenerates the index from src/subjects/
scripts/run-desktop.ps1          # Starts the Tauri desktop app without syncing Cargo output
scripts/build-desktop.ps1        # Builds and collects the Windows executables
src-tauri/                       # Tauri configuration and Rust desktop shell
src/themes.json              # Original theme styles
src/app.css                  # Shared component styles
tests/                       # Storage, subject data and browser workflow checks
My-VCE-revision-tracker.html  # Preserved standalone version for migration/backup
vce-tracker-progress.json    # Compatible progress backup
```

## How subject content loads

Subject content is split so the app does not download all twenty-nine subjects to show the dashboard.

`src/subjects/` holds one file per subject and is the only place subject content is edited. `src/subjects-index.json` is generated from those files and holds just each subject's id, name, accent colour and the id of every point. That is all the setup screen, the dashboard progress bars and saved-progress validation need, and it is about 4 kB compressed.

A subject's full content, including the detail for each point and every practice question and marking guide, is fetched only when that subject is opened. Selected subjects are also fetched quietly in the background shortly after the dashboard appears, so opening one is usually instant. Subjects you do not study are never downloaded.

To add or edit a subject, change the file in `src/subjects/` and run `npm run build:index`. The `dev`, `build` and `test` scripts run it automatically, and a test fails if the committed index does not match the subject files.

## Technology

The active application uses React and Vite, with Google Fonts loaded when available. React controls the interface, ratings, subject choices, practice answers, and themes. No account or backend is required.

## Moving existing progress

Before switching, open the original HTML tracker and choose **Save a backup file**. In the React app, choose **Load a backup file** and select that export. The current backup format is version 4. Older three-pass ratings are migrated into current confidence plus rating history, and older practice answers are migrated into question-level attempt history.

Browser storage belongs to a particular address. The original file, localhost, and a future hosted website have separate storage even on the same computer. Choose your subjects again on the new address and reconnect your OneDrive progress file if you use file sync.

In Chrome or Edge, **Open sync file** loads an existing JSON file and **Create sync file** writes the current progress to a file. A saved connection can be reauthorized with **Reconnect sync file**. Avoid editing progress on both computers simultaneously.

## Build and verify

```powershell
npm run build:index
npm run build
npm run preview
npm test
npm run test:browser
```

The build produces `dist/` for static hosting. Browser tests use installed Microsoft Edge. The React conversion does not yet include PWA installation or offline caching.

## Data and privacy

Ratings are stored locally in the browser and are not sent to a server by the application. Exported JSON backups contain revision progress, so treat them as personal study data when sharing them.

## Copyright

Copyright © 2026 Sam Sell. All rights reserved.

This is proprietary software. It may not be copied, modified, redistributed, or sold without written permission from the copyright holder. See [COPYRIGHT.md](COPYRIGHT.md).
