# VCE Revision Tracker

A React revision tracker for VCE Units 3 & 4. It helps students work through key knowledge points, rate their confidence over three revision passes, and focus on topics that still need attention.

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
- Global Politics
- Health and Human Development
- History: Revolutions
- Legal Studies
- Literature
- Mathematical Methods
- Media
- Philosophy
- Physical Education
- Physics
- Product Design and Technology
- Psychology
- Sociology
- Software Development
- Specialist Mathematics
- Visual Communication Design

## Features

- Three-pass confidence tracking for every key knowledge point
- Red, amber, and green progress summaries
- Filters for unrated and weaker topics
- Automatically generated cue-card decks for revision
- Interactive practice questions with answer reveals
- Four visual themes: Glass, Poster, Midnight, and Notebook
- Automatic progress saving in the browser
- JSON backup and restore for moving progress between computers
- Responsive, accessible, and print-friendly design

## Run locally

Install Node.js 22.12+ (or Node.js 24) and run these commands from the project folder:

```powershell
npm ci
npm run dev
```

Open http://127.0.0.1:5173 in your browser. Use the same address each time to retain access to browser-saved progress.

1. Download or clone this repository.
2. Install dependencies and start the development server as shown above.
3. On your first visit, select the subjects you study and choose **Start revising**.
4. Open a subject and click a numbered pass box to cycle through confidence levels.

Use **Change subjects** on the dashboard to update your selection later. Your choices are remembered in this browser, and dashboard totals cover only your selected subjects. Removing a subject from the dashboard keeps its saved ratings, so you can add it back later. Setup currently offers the twenty-nine subjects listed above.

Biology, Business Management, Chemistry, Economics, Legal Studies, Psychology and Specialist Mathematics were added as full-depth subjects: each has 56 to 83 paraphrased revision checkpoints covering Units 3 and 4, and every checkpoint carries one original practice question with a suggested marking guide. Their checklist numbers are internal tracker IDs, not VCAA syllabus numbering, and the practice questions are original revision exercises rather than official VCAA questions. Each subject links to its VCAA study design and examination resources. Chemistry, Specialist Mathematics, Business Management, Legal Studies and Economics group their checkpoints by topic rather than by official area of study title. Legal Studies and Economics cover areas where the law, policy settings and published figures change, so check current detail against VCAA and other official sources.

English, History: Revolutions, Geography, Physical Education, Accounting, Applied Computing: Data Analytics, Visual Communication Design, Media and Product Design and Technology were added as skills-based subjects, with 36 to 59 checkpoints each and one original practice question per checkpoint. Because set texts, case studies and chosen revolutions differ between schools, many of their checkpoints ask you to apply a skill to your own texts and examples rather than testing recall of a particular one. English and English Language are separate subjects with separate saved progress.

Ancient History, Literature, Global Politics, Philosophy, Environmental Science, Sociology and Food Studies were added most recently. Ancient History covers Egypt, Greece and Rome alongside shared skills and thematic areas, so use the societies your class studies. Health and Human Development, which originally carried only four practice questions across its 49 checkpoints, now has a question and marking guide on every point, so every subject in the tracker is at full depth.

Progress is stored in the browser using local storage. Use **Save a backup file** to export your progress and **Load a backup file** to restore it later. The included `vce-tracker-progress.json` file is a compatible progress backup.

## Project structure

```text
index.html                   # React application entry page
src/App.jsx                  # React screens and interactive components
src/storage.js               # Saved-progress validation and backup compatibility
src/subjects/                # One file per subject: points, details, questions
src/subjects-index.json      # Generated: ids, names and point ids only
src/subject-loader.js        # Loads a subject's content when it is opened
scripts/build-subject-index.mjs  # Regenerates the index from src/subjects/
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

Before switching, open the original HTML tracker and choose **Save a backup file**. In the React app, choose **Load a backup file** and select that export. Ratings and practice answers use the existing storage keys and version-3 backup format; older subject-rating backups are also accepted.

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
