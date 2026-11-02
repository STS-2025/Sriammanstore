# Sri Amman Smart Store development

## Start the application

Run the frontend only:

```powershell
npm.cmd run dev
```

This starts Vite on `http://127.0.0.1:5173`. It uses the configured Firebase services directly. Service errors are shown to the user; there is no local mock API or automatic data fallback.

## Firebase and customer data

The frontend uses the Firebase web SDK and Firestore rules for authorization. This migration does not deploy Functions or rules and does not create or modify Firebase records. Profile creation for new SASS customers remains unavailable until an approved ID allocation source and trusted profile-creation backend are provided. Phone verification or Google sign-in by itself is not a completed customer registration.

The local JSON Server database, its seed scripts, and the saved emulator export have been removed. Firebase project and rules configuration remains in the repository; no emulator is started by the frontend command.

## Checks

```powershell
npx tsc --noEmit --incremental false
npx vitest run <source-only-test-file>
```

Do not run migration or production data scripts as part of ordinary development.
