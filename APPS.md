# Rescue Drift apps

Both apps bundle all six missions and run offline.

## Windows 64-bit

Extract `release/Rescue-Drift-Windows-x64.zip`, open the `win-unpacked` folder, and run `Rescue Drift.exe`. Keep the extracted files together. This is a portable app with no installer. It is unsigned. Use WASD or arrow keys to fly, Q/E for the rope, Escape to pause, and F11 for fullscreen.

Rebuild with `npm ci` followed by `npm run app:windows`.

## Android 7.0 or later

The native Android Studio project is in `android/`. It bundles the game and uses the existing on-screen flight and rope buttons. Swipe from an edge to reveal Android system navigation.

To create an APK, install Android Studio 2025.2.1 or newer with Android SDK 36 and its bundled Java runtime. Open the `android/` folder in Android Studio, complete SDK setup and Gradle sync, then use **Build > Generate App Bundles or APKs > Generate APKs**. The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. Copy it to your phone and open it to install. Android may request permission to install apps from that source.

After changing the game, run `npm run app:android` before building the APK again. A Play Store release requires your own release signing key and a signed Android App Bundle.

The Android project has been generated and its web assets synchronized. Android compilation and device testing require the Android SDK and Java, which were unavailable on the build computer.

