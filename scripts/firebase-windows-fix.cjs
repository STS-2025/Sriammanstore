"use strict";

/**
 * Windows EPERM workaround for Firebase Emulator Hub export (`hubExport.js`).
 *
 * When Vite (`vite dev`) or JSON Server (`json-server --watch`) is running in the
 * workspace root on Windows, directory watchers (`ReadDirectoryChangesW`) can hold
 * a brief handle on the temporary `firebase-export-*` folder created by `HubExport`,
 * causing `fs.renameSync(tmpDir, exportPath)` inside `fs-extra.moveSync` to throw
 * `EPERM`. Falling back to recursive copy + remove (matching `fs-extra`'s `EXDEV`
 * path) ensures both `firebase emulators:export` and `--export-on-exit` succeed
 * reliably on Windows.
 */
const fs = require("fs");

const originalRenameSync = fs.renameSync.bind(fs);

fs.renameSync = function patchedRenameSync(oldPath, newPath) {
  try {
    return originalRenameSync(oldPath, newPath);
  } catch (err) {
    const isPermError =
      err && (err.code === "EPERM" || err.code === "EACCES" || err.code === "EBUSY");
    const pathStr = `${String(oldPath)} -> ${String(newPath)}`;
    if (
      isPermError &&
      (pathStr.includes("firebase-export-") || pathStr.includes(".firebase-emulator-data"))
    ) {
      fs.cpSync(oldPath, newPath, { recursive: true, force: true });
      fs.rmSync(oldPath, { recursive: true, force: true });
      return;
    }
    throw err;
  }
};

