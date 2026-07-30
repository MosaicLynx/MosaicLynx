import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import { useT } from '../src/i18n';
import { useMobileStore } from '../src/store';
import { Body, Button, Card, Field, LinkButton, Screen, TestnetBanner } from '../src/ui';

export default function AccountAddHd() {
  const store = useMobileStore();
  const router = useRouter();
  const t = useT();
  const name = useRef('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const state = store.state;
  const profile = state?.profiles.find((item) => item.id === state.settings.activeProfileId) ?? state?.profiles[0];
  if (!profile) return null;

  const add = async () => {
    setBusy(true);
    setError('');
    try {
      await store.addDerivedAccount(profile.id, name.current);
      name.current = '';
      router.replace('/accounts');
    } catch {
      setError(t('accountAddFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen title={t('addHdAccount')}>
      <TestnetBanner text={t('testnet')} />
      <Card>
        <Field
          placeholder={t('accountName')}
          onChangeText={(value) => {
            name.current = value;
          }}
        />
        <Button disabled={busy} onPress={() => void add()}>
          {busy ? t('busy') : t('add')}
        </Button>
      </Card>
      {error ? <Body>{error}</Body> : null}
      <LinkButton onPress={() => router.back()}>{t('back')}</LinkButton>
    </Screen>
  );
}
