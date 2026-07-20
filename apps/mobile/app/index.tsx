import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useMobileStore } from '../src/store';

export default function Index() {
  const store = useMobileStore();
  if (!store.ready || !store.state)
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  if (!store.state.profiles.length) return <Redirect href="/onboarding" />;
  const profileId = store.state.settings.activeProfileId ?? store.state.profiles[0]!.id;
  return <Redirect href={store.unlockedProfileIds.has(profileId) ? '/home' : '/unlock'} />;
}
