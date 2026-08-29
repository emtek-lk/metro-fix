/**
 * @format
 */

import { AppRegistry, Platform } from 'react-native';
import App from './App';
import appConfig from './app.json';

AppRegistry.registerComponent(appConfig.name, () => App);

if (Platform.OS === 'web') {
  const rootTag = document.getElementById('root') || document.getElementById('main') || document.body;
  AppRegistry.runApplication(name, {
    initialProps: {},
    rootTag,
  });
}
