# METRO-FIX mobile apps

Expo / React Native (bare workflow) app for technicians, with a customer flow too. Both roles sign in to the same app and get their own screens.

**To run it, follow [SETUP.md](../../SETUP.md) section 5** (the API must be running first). The short version:

```bash
cd apps/mobile
npm run dev          # Metro (expo start): press i (iOS), a (Android) or w (browser preview)
npm run ios          # build and launch on an iOS simulator (run `bundle exec pod install` in ios/ first)
npm run android      # build and launch on an Android emulator or device (adb reverse tcp:8081 tcp:8081 first)
npm test             # Jest
npx tsc --noEmit     # type-check
```

- Android release APK: `npm run build:android:release` (npm 9; or run the Gradle command in the script by hand). Output: `android/app/build/outputs/apk/release/app-release.apk` (about 27 MB: arm64 only, code and resources shrunk). It uses the hosted API from `.env.production`. Signed with the debug key: fine for installing on your own devices and sharing with testers, not for the Play Store.
- API address: `EXPO_PUBLIC_API_URL` in `.env` for development (`.env.example` lists the right value for the iOS simulator, the Android emulator and a real phone). **Release builds** read `.env.production`, which points at the hosted API (see HOSTING.md part 4). To try the hosted API from a debug build: `EXPO_PUBLIC_API_URL=https://api-metrofix.vanguardprotection.lk npx react-native start --reset-cache`.
- Demo logins (password `Demo123!`): `worker1@demo.local` (technician), `marcus@residences.lk` (customer).
- Rebuild the native app after changing icons, the splash screen, `ios/mobile/Info.plist` or any native dependency; JavaScript changes only need Metro.
- The map picker uses a bundled copy of Leaflet (`src/vendor/leafletBundle.ts`); regenerate it with `npm run build:leaflet`.
