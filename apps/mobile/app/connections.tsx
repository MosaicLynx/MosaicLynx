import { useRouter } from 'expo-router';

import { useT } from '../src/i18n';
import { useMobileStore } from '../src/store';
import { Body, Card, LinkButton, Screen, TestnetBanner } from '../src/ui';

export default function Connections() {
  const store = useMobileStore();
  const router = useRouter();
  const t = useT();
  const profileId = store.state?.settings.activeProfileId;
  const permissions = store.state?.permissions.filter((grant) => grant.profileId === profileId) ?? [];
  return (
    <Screen title={t('connections')}>
      <TestnetBanner text={t('testnet')} />
      <Card>
        <Body>{t('noConnections')}</Body>
      </Card>
      {permissions.map((grant) => (
        <Card key={`${grant.origin}-${grant.scope.id}`}>
          <Body>{grant.origin}</Body>
          <Body muted>
            {grant.scope.id} · {grant.accountIds.length}
          </Body>
        </Card>
      ))}
      <LinkButton onPress={() => router.back()}>{t('back')}</LinkButton>
    </Screen>
  );
}
