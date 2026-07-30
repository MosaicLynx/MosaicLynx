import { useRouter } from 'expo-router';
import { useState } from 'react';

import { useT } from '../src/i18n';
import { useMobileStore } from '../src/store';
import { Address, Body, Button, Card, LinkButton, Screen, TestnetBanner } from '../src/ui';

export default function Accounts() {
  const store = useMobileStore();
  const router = useRouter();
  const t = useT();
  const [error, setError] = useState('');
  const state = store.state;
  const profile = state?.profiles.find((item) => item.id === state.settings.activeProfileId) ?? state?.profiles[0];
  if (!state || !profile) return null;
  const remove = async (accountId: string) => {
    setError('');
    try {
      await store.deleteAccount(profile.id, accountId);
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message === 'LAST_ACCOUNT' ? t('lastAccount') : t('accountUpdateFailed')
      );
    }
  };
  return (
    <Screen title={t('accounts')}>
      <TestnetBanner text={t('testnet')} />
      {state.accounts
        .filter((account) => account.profileId === profile.id && account.status === 'active')
        .map((account) => (
          <Card key={account.id}>
            <Body>{account.name}</Body>
            <Body muted>{account.source.kind}</Body>
            <Address>{account.identities[state.settings.activeChain].address}</Address>
            <LinkButton onPress={() => void store.selectAccount(profile.id, account.id)}>
              {t('selectAccount')}
            </LinkButton>
            <Button danger onPress={() => void remove(account.id)}>
              {t('delete')}
            </Button>
          </Card>
        ))}
      <Card>
        <LinkButton onPress={() => router.push('/account-add')}>{t('addAccount')}</LinkButton>
      </Card>
      {error ? <Body>{error}</Body> : null}
      <LinkButton onPress={() => router.back()}>{t('back')}</LinkButton>
    </Screen>
  );
}
