import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import CaptureScreen from './CaptureScreen';
import AnalysisScreen from './AnalysisScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="CaptureScreen">
        <Stack.Screen name="CaptureScreen" component={CaptureScreen} options={{ title: 'Capture Spectra' }} />
        <Stack.Screen name="AnalysisScreen" component={AnalysisScreen} options={{ title: 'Analysis Results' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
