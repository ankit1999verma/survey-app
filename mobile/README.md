# GPSurveyPro — Mobile

React Native (Expo 56) app for GPS-based survey data collection.

## Prerequisites

| Tool | Min Version | Install |
|------|-------------|---------|
| Node.js | 18+ | https://nodejs.org |
| npm | 10+ | bundled with Node |
| Xcode | 15+ | Mac App Store |
| CocoaPods | 1.15+ | `sudo gem install cocoapods` |
| Expo CLI | 56+ | `npm install -g expo-cli` |

> **macOS only** for iOS simulator. Xcode must be installed with iOS simulators.

---

## Setup

```bash
# 1. Install JS dependencies
cd mobile
npm install

# 2. Install iOS native dependencies
cd ios && pod install && cd ..
```

---

## Run on iOS Simulator (Xcode)

### Quick start (auto-selects booted simulator)
```bash
npm run ios
# or
npx expo run:ios
```

### Target a specific device
```bash
# List available simulators
xcrun simctl list devices available

# Run on specific device (example: iPhone 17 Pro Max)
npx expo run:ios --device "iPhone 17 Pro Max"
```

### Boot simulator manually first, then run
```bash
# Boot simulator
xcrun simctl boot "iPhone 17 Pro Max"

# Open Simulator.app
open -a Simulator

# Then run the app
npx expo run:ios --device "iPhone 17 Pro Max"
```

---

## Run on Android Emulator

```bash
# Requires Android Studio + emulator running
npm run android
# or
npx expo run:android
```

---

## Dev Server Only (Expo Go / dev client)

```bash
npm start
# or
npx expo start
```

Then press `i` for iOS, `a` for Android in the terminal.

---

## Rebuild After Native Changes

If you add/remove native packages or change `app.json`:

```bash
cd ios && pod install && cd ..
npx expo run:ios --device "iPhone 17 Pro Max"
```

---

## Common Errors

| Error | Fix |
|-------|-----|
| `pod install` fails | `sudo gem install cocoapods` then retry |
| `ENOENT cached-packages.json` | Kill all expo processes, delete `.expo/prebuild/`, retry |
| `No devices found` | Boot simulator first: `xcrun simctl boot <UDID>` |
| Metro bundler port conflict | `npx kill-port 8081` then retry |
| Xcode build fails (cert) | Product → Destination → select simulator (not device) |

---

## Project Structure

```
mobile/
├── src/
├── assets/
├── ios/              ← Xcode native project (GPSurveyPro)
├── App.js
├── index.js
└── app.json
```

## Backend

See `../backend/` for FastAPI server. App connects to `192.168.1.176` by default — update base URL in `src/` if your IP differs.
