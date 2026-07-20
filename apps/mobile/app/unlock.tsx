import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import { useT } from '../src/i18n';
import { useMobileStore } from '../src/store';
import { Body, Button, Card, Field, Screen, TestnetBanner } from '../src/ui';

export default function Unlock() {
  const store = useMobileStore();
  const router = useRouter();
  const t = useT();
  const password = useRef('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const profile =
    store.state?.profiles.find((item) => item.id === store.state?.settings.activeProfileId) ?? store.state?.profiles[0];
  if (!profile) return null;
  const submit = async () => {
    setBusy(true);
    setError(false);
    try {
      await store.unlock(profile.id, password.current);
      password.current = '';
      router.replace('/home');
    } catch {
      setError(true);
    } finally {
      password.current = '';
      setBusy(false);
    }
  };
  return (
    <Screen title={t('unlock')}>
      <TestnetBanner text={t('testnet')} />
      <Card>
        <Body>{profile.name}</Body>
        {profile.passwordHint ? <Body muted>{profile.passwordHint}</Body> : null}
        <Field
          accessibilityLabel={t('password')}
          placeholder={t('password')}
          secureTextEntry
          onChangeText={(value) => {
            password.current = value;
          }}
          onSubmitEditing={() => void submit()}
        />
        {error ? <Body>{t('invalidPassword')}</Body> : null}
        <Button disabled={busy} onPress={() => void submit()}>
          {busy ? t('busy') : t('unlock')}
        </Button>
      </Card>
    </Screen>
  );
}
