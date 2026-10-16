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

- API address: `EXPO_PUBLIC_API_URL` in `.env` (`.env.example` lists the right value for the iOS simulator, the Android emulator and a real phone).
- Demo logins (password `Demo123!`): `worker1@demo.local` (technician), `marcus@residences.lk` (customer).
- Rebuild the native app after changing icons, the splash screen, `ios/mobile/Info.plist` or any native dependency; JavaScript changes only need Metro.
- The map picker uses a bundled copy of Leaflet (`src/vendor/leafletBundle.ts`); regenerate it with `npm run build:leaflet`.
