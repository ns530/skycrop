/**
 * FieldsNavigator - Field Management Navigation
 * 
 * Stack navigation for field-related screens
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import FieldsListScreen from '../screens/fields/FieldsListScreen';
import FieldDetailScreen from '../screens/fields/FieldDetailScreen';
import CreateFieldScreen from '../screens/fields/CreateFieldScreen';
import FieldHealthScreen from '../screens/fields/FieldHealthScreen';
import FieldRecommendationsScreen from '../screens/fields/FieldRecommendationsScreen';
import FieldYieldScreen from '../screens/fields/FieldYieldScreen';

export type FieldsStackParamList = {
  FieldsList: undefined;
  FieldDetail: { fieldId: string };
  CreateField: undefined;
  FieldHealth: { fieldId: string };
  FieldRecommendations: { fieldId: string };
  FieldYield: { fieldId: string };
};

const Stack = createStackNavigator<FieldsStackParamList>();

export const FieldsNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="FieldsList"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="FieldsList" 
        component={FieldsListScreen}
        options={{ title: 'My Fields' }}
      />
      <Stack.Screen 
        name="FieldDetail" 
        component={FieldDetailScreen}
        options={{ title: 'Field Details' }}
      />
      <Stack.Screen 
        name="CreateField" 
        component={CreateFieldScreen}
        options={{ title: 'Add New Field' }}
      />
      <Stack.Screen 
        name="FieldHealth" 
        component={FieldHealthScreen}
        options={{ title: 'Field Health' }}
      />
      <Stack.Screen 
        name="FieldRecommendations" 
        component={FieldRecommendationsScreen}
        options={{ title: 'Recommendations' }}
      />
      <Stack.Screen 
        name="FieldYield" 
        component={FieldYieldScreen}
        options={{ title: 'Yield Forecast' }}
      />
    </Stack.Navigator>
  );
};

