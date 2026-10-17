package com.mobile
import android.os.Build
import android.os.Bundle
import expo.modules.ReactActivityDelegateWrapper

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * react-native-screens must not restore its fragments after Android recreates the activity
   * (theme, rotation or language change); passing null avoids a crash on restore.
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
    // The app has its own light / dark themes; keep the phone's automatic dark mode (Xiaomi MIUI and
    // Android 10+ "force dark") from darkening it again after the user picks Light.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      window.decorView.isForceDarkAllowed = false
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "mobile"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      ReactActivityDelegateWrapper(this, BuildConfig.IS_NEW_ARCHITECTURE_ENABLED, DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled))
}
