import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import { useT } from '../src/i18n';
import { useMobileStore } from '../src/store';
import { Body, Button, Card, Field, LinkButton, Screen, TestnetBanner } from '../src/ui';

export default function Accounts() {
  const store = useMobileStore();
  const router = useRouter();
  const t = useT();
  const name = useRef('');
  const key = useRef('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const state = store.state;
  const profile = state?.profiles.find((item) => item.id === state.settings.activeProfileId) ?? state?.profiles[0];
  if (!state || !profile) return null;
  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      name.current = '';
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message === 'LAST_ACCOUNT' ? t('lastAccount') : 'Unable to update the account.'
      );
    } finally {
      key.current = '';
      setBusy(false);
    }
  };
  return (
    <Screen title={t('accounts')}>
      <TestnetBanner text={t('testnet')} />
      {state.accounts
        .filter((account) => account.profileId === profile.id)
        .map((account) => (
          <Card key={account.id}>
            <Body>{account.name}</Body>
            <Body muted>{account.source.kind}</Body>
            <Body selectable>{account.identities[state.settings.activeChain].address}</Body>
            <LinkButton onPress={() => void store.selectAccount(profile.id, account.id)}>
              {t('selectAccount')}
            </LinkButton>
            <Button danger onPress={() => void run(() => store.deleteAccount(profile.id, account.id))}>
              {t('delete')}
            </Button>
          </Card>
        ))}
      <Card>
        <Body>{t('addDerived')}</Body>
        <Field
          placeholder={t('accountName')}
          onChangeText={(value) => {
            name.current = value;
          }}
        />
        <Button disabled={busy} onPress={() => void run(() => store.addDerivedAccount(profile.id, name.current))}>
          {t('add')}
        </Button>
      </Card>
      <Card>
        <Body>{t('importKey')}</Body>
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
            key.current = value;
          }}
        />
        <Button
          disabled={busy}
          onPress={() => void run(() => store.importPrivateKey(profile.id, name.current, key.current))}
        >
          {t('add')}
        </Button>
      </Card>
      {error ? <Body>{error}</Body> : null}
      <LinkButton onPress={() => router.back()}>{t('back')}</LinkButton>
    </Screen>
  );
}
