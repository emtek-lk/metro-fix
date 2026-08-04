/**
 * @format
 */

import '@expo/metro-runtime';
import { AppRegistry, Platform } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

const name = appName || 'main';
AppRegistry.registerComponent(name, () => App);

if (Platform.OS === 'web') {
  const rootTag = document.getElementById('root') || document.getElementById('main') || document.body;
  AppRegistry.runApplication(name, {
    initialProps: {},
    rootTag,
  });
}
