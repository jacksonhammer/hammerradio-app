import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import COLORS from '../theme/colors';
import PlayerBar from '../components/PlayerBar';

import HomeScreen    from '../screens/HomeScreen';
import ChatScreen    from '../screens/ChatScreen';
import RequestScreen from '../screens/RequestScreen';
import CallInScreen  from '../screens/CallInScreen';
import NewsScreen    from '../screens/NewsScreen';
import ArchiveScreen from '../screens/ArchiveScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TABS = [
  { name: 'Home',    icon: '🏠', label: 'Home'    },
  { name: 'Chat',    icon: '💬', label: 'Chat'    },
  { name: 'Request', icon: '🎵', label: 'Request' },
  { name: 'CallIn',  icon: '📞', label: 'Call In' },
  { name: 'News',    icon: '📡', label: 'Updates' },
  { name: 'Archive', icon: '🎙', label: 'Archive' },
  { name: 'Profile', icon: '👤', label: 'Me'      },
];

function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.wrapper}>
      <PlayerBar />
      <View style={[styles.tabRow, { paddingBottom: insets.bottom || 8 }]}>
        {state.routes.map((route, index) => {
          const tab     = TABS.find(t => t.name === route.name) || {};
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
            >
              <Text style={[styles.icon, focused && styles.iconFocused]}>{tab.icon || '•'}</Text>
              <Text style={[styles.label, focused && styles.labelFocused]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{
            headerStyle:      { backgroundColor: COLORS.NAVY },
            headerTitleStyle: { color: COLORS.ORANGE, fontWeight: '800' },
            headerTintColor:  COLORS.ORANGE,
          }}
        >
          <Tab.Screen name="Home"    component={HomeScreen}    options={{ headerTitle: 'Hammer Radio' }} />
          <Tab.Screen name="Chat"    component={ChatScreen}    />
          <Tab.Screen name="Request" component={RequestScreen} />
          <Tab.Screen name="CallIn"  component={CallInScreen}  options={{ title: 'Call In', headerTitle: 'Call In Live' }} />
          <Tab.Screen name="News"    component={NewsScreen}    options={{ headerTitle: 'News & Updates' }} />
          <Tab.Screen name="Archive" component={ArchiveScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerTitle: 'My Profile' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  wrapper:      { backgroundColor: COLORS.SURFACE, borderTopWidth: 1, borderTopColor: COLORS.BORDER },
  tabRow:       { flexDirection: 'row', backgroundColor: COLORS.NAVY },
  tab:          { flex: 1, alignItems: 'center', paddingVertical: 6 },
  icon:         { fontSize: 18, opacity: 0.45 },
  iconFocused:  { fontSize: 20, opacity: 1 },
  label:        { fontSize: 9, color: COLORS.MUTED, marginTop: 2, fontWeight: '500' },
  labelFocused: { color: COLORS.ORANGE, fontWeight: '700' },
});
