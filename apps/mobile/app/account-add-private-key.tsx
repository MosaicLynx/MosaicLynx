import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import { useT } from '../src/i18n';
import { useMobileStore } from '../src/store';
import { Body, Button, Card, Field, LinkButton, Screen, TestnetBanner } from '../src/ui';

export default function AccountAddPrivateKey() {
  const store = useMobileStore();
  const router = useRouter();
  const t = useT();
  const name = useRef('');
  const privateKey = useRef('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const state = store.state;
  const profile = state?.profiles.find((item) => item.id === state.settings.activeProfileId) ?? state?.profiles[0];
  if (!profile) return null;

  const add = async () => {
    setBusy(true);
    setError('');
    try {
      await store.importPrivateKey(profile.id, name.current, privateKey.current);
      name.current = '';
      privateKey.current = '';
      router.replace('/accounts');
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message === 'INVALID_PRIVATE_KEY'
          ? t('invalidPrivateKey')
          : t('accountAddFailed')
      );
    } finally {
      privateKey.current = '';
      setBusy(false);
    }
  };

  return (
    <Screen title={t('addPrivateKeyAccount')}>
      <TestnetBanner text={t('testnet')} />
      <Card>
        <Body muted>{profile.enabledChains.map((chain) => (chain === 'symbol' ? 'Symbol' : 'NEM')).join(' / ')}</Body>
        <Field
          placeholder={t('accountName')}
          onChangeText={(value) => {
            name.current = value;
          }}
        />
        <Field
          placeholder={t('privateKey')}
          secureTextEntry
          autoCapitalize="characters"
          autoCorrect={false}
          onChangeText={(value) => {
            privateKey.current = value;
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
