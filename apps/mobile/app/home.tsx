import { useRouter } from 'expo-router';

import { useT } from '../src/i18n';
import { useMobileStore } from '../src/store';
import { Body, Button, Card, LinkButton, Row, Screen, TestnetBanner } from '../src/ui';

export default function Home() {
  const store = useMobileStore();
  const router = useRouter();
  const t = useT();
  const state = store.state;
  if (!state) return null;
  const profile = state.profiles.find((item) => item.id === state.settings.activeProfileId) ?? state.profiles[0];
  if (!profile) return null;
  if (!store.unlockedProfileIds.has(profile.id)) {
    router.replace('/unlock');
    return null;
  }
  const account = state.accounts.find((item) => item.id === profile.defaultAccountId)!;
  const chain = state.settings.activeChain;
  return (
    <Screen title={t('home')}>
      <TestnetBanner text={t('testnet')} />
      <Card>
        <Body muted>{t('profile')}</Body>
        <Body>{profile.name}</Body>
        <Row>
          {state.profiles.map((item) => (
            <LinkButton
              key={item.id}
              onPress={() =>
                void store.selectProfile(item.id).then(() => item.id !== profile.id && router.replace('/unlock'))
              }
            >
              {item.name}
            </LinkButton>
          ))}
        </Row>
      </Card>
      <Card>
        <Body muted>{t('chain')}</Body>
        <Row>
          <Button onPress={() => void store.selectChain('symbol')}>Symbol</Button>
          <Button onPress={() => void store.selectChain('nem')}>NEM</Button>
        </Row>
      </Card>
      <Card>
        <Body muted>{t('account')}</Body>
        <Body>{account.name}</Body>
        <Row>
          {state.accounts
            .filter((item) => item.profileId === profile.id)
            .map((item) => (
              <LinkButton key={item.id} onPress={() => void store.selectAccount(profile.id, item.id)}>
                {item.name}
              </LinkButton>
            ))}
        </Row>
        <Body muted>{t('address')}</Body>
        <Body selectable>{account.identities[chain].address}</Body>
        <Body muted>{t('publicKey')}</Body>
        <Body selectable>{account.identities[chain].publicKey}</Body>
      </Card>
      <Card>
        <LinkButton onPress={() => router.push('/accounts')}>{t('accounts')}</LinkButton>
        <LinkButton onPress={() => router.push('/backup')}>{t('backup')}</LinkButton>
        <LinkButton onPress={() => router.push('/connections')}>{t('connections')}</LinkButton>
        <LinkButton onPress={() => router.push('/settings')}>{t('settings')}</LinkButton>
      </Card>
      <Button
        danger
        onPress={() => {
          store.lock(profile.id);
          router.replace('/unlock');
        }}
      >
        {t('lock')}
      </Button>
    </Screen>
  );
}
