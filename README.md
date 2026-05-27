# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```
Running in local android phione

npx expo start -c --lan           

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo


```bash
npm run reset-project
```

==========================================================
Since your app is Expo-based (from your screenshot):

👉 You don’t build APK locally like Android Studio by default
👉 You use EAS Build (Expo’s official way)

✅ BEST METHOD (Recommended): EAS Build (Cloud)

This is what most devs use now.

🟢 Step 1: Install EAS CLI
npm install -g eas-cli

🟢 Step 2: Login to Expo
eas whoami
eas login

🟢 Step 3: Initialize EAS
Inside your project:
eas build:configure

👉 This creates:

eas.json


🟢 Step 4: Build APK
eas build -p android --profile preview


👉 After a few minutes:
You’ll get a download link
That is your APK

-------------------------------
⚡ If you want DIRECT APK (not AAB)

Edit eas.json:

{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}

Then run again:Quick testing APK (occasionally):

eas build -p android --profile preview

Production:
eas build -p android --profile production

========================================
🔵 Alternative (LOCAL APK - harder)

Only if you insist:

npx expo prebuild

Then:

cd android
gradlew assembleRelease

👉 APK path:

android/app/build/outputs/apk/release/app-release.apk

==========================
1. For testing on phone:
eas build --profile preview


2. For Play Store:
eas build --profile production