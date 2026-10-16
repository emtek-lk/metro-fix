import UIKit
import React
import React_RCTAppDelegate

// iOS 26+ requires apps to adopt the UIScene lifecycle. The window is created here
// (not in AppDelegate) and React Native is started inside it.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard
      let windowScene = scene as? UIWindowScene,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory
    else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    // Preserve cold-start deep links for Linking.getInitialURL().
    var launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    if let url = connectionOptions.urlContexts.first?.url {
      launchOptions = [.url: url]
    }

    factory.startReactNative(
      withModuleName: "mobile",
      in: window,
      launchOptions: launchOptions
    )
  }

  // Deep links while the app is running are delivered to the scene, so forward
  // them to the app delegate handlers that Expo / React Native Linking listen on.
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let context = URLContexts.first else { return }
    _ = UIApplication.shared.delegate?.application?(
      UIApplication.shared,
      open: context.url,
      options: [:]
    )
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = UIApplication.shared.delegate?.application?(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }
}
