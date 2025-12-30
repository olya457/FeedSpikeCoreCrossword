import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

import LoaderScreen from '../screens/LoaderScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MenuScreen from '../screens/MenuScreen';

import LevelsScreen from '../screens/LevelsScreen';
import LevelPlayScreen from '../screens/LevelPlayScreen'; 

import RewardsScreen from '../screens/RewardsScreen';
import StoriesScreen from '../screens/StoriesScreen';
import SaveScreen from '../screens/SaveScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Loader"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Loader" component={LoaderScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />

        <Stack.Screen name="Levels" component={LevelsScreen} />
        <Stack.Screen
          name="LevelPlay"
          component={LevelPlayScreen}
          options={{ animation: 'fade' }}
        />

        <Stack.Screen name="Rewards" component={RewardsScreen} />
        <Stack.Screen name="Stories" component={StoriesScreen} />
        <Stack.Screen name="Save" component={SaveScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
