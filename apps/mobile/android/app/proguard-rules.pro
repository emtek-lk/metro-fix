# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Release builds shrink the code (R8). Expo looks these classes up by name when a background task
# (the technician's location tracking) has to start the app headlessly; without a keep rule the
# shrinker removes them and the lookup fails with ClassNotFoundException.
-keep class expo.modules.adapters.react.apploader.** { *; }
-keep class expo.modules.apploader.** { *; }
