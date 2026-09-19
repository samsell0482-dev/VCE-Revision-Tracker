# Release process

## 1. Prepare the version

Keep the version identical in:

- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

Update `CHANGELOG.md`, `RELEASE_NOTES.md`, and the README before tagging.

## 2. Verify

```powershell
npm ci
npm test
npm run test:browser
npm run app:build
```

Manually test first-run setup, rating persistence, practice attempts, backup import/export, fullscreen controls, and both Windows downloads.

## 3. Commit and tag

```powershell
git add --all
git commit -m "Prepare v1.0.0 release"
git tag -a v1.0.0 -m "VCE Revision Tracker v1.0.0"
git push origin main
git push origin v1.0.0
```

Do not move an existing published release tag. Increment the version for later releases.

## 4. Publish on GitHub

Create a GitHub release from the tag, use `VCE Revision Tracker v1.0.0` as its title, and copy the contents of `RELEASE_NOTES.md` into the description.

Upload:

- `desktop-build/VCE Revision Tracker Setup.exe`
- `desktop-build/VCE Revision Tracker.exe`
- `desktop-build/SHA256SUMS.txt`

Download the published assets once and confirm their SHA-256 hashes match before sharing the release.
