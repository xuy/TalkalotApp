import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import RecordingScreen from './screens/RecordingScreen';

export type RootStackParamList = {
  Home: undefined;
  Recording: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Recording" component={RecordingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
