# VCE Revision Tracker

A self-contained revision tracker for VCE Units 3 & 4. It helps students work through key knowledge points, rate their confidence over three revision passes, and focus on topics that still need attention.

## Subjects included

- English Language
- General Mathematics
- Mathematical Methods
- Physics
- Software Development

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

No installation or build tools are required.

1. Download or clone this repository.
2. Open `My-VCE-revision-tracker.html` in a modern web browser.
3. Choose a subject and click a numbered pass box to cycle through confidence levels.

Progress is stored in the browser using local storage. Use **Save a backup file** to export your progress and **Load a backup file** to restore it later. The included `vce-tracker-progress.json` file is a compatible progress backup.

## Project structure

```text
My-VCE-revision-tracker.html  # Complete application: HTML, CSS, JavaScript, and study content
vce-tracker-progress.json     # Progress backup that can be imported into the tracker
README.md                     # Project documentation
```

## Technology

The tracker uses plain HTML, CSS, and JavaScript, with Google Fonts loaded when an internet connection is available. All application logic and study content are contained in a single HTML file.

## Data and privacy

Ratings are stored locally in the browser and are not sent to a server by the application. Exported JSON backups contain revision progress, so treat them as personal study data when sharing them.
