import { useRouter } from 'expo-router';

import { useT } from '../src/i18n';
import { Body, Button, Card, LinkButton, Screen, TestnetBanner } from '../src/ui';

export default function AccountAdd() {
  const router = useRouter();
  const t = useT();
  return (
    <Screen title={t('addAccount')}>
      <TestnetBanner text={t('testnet')} />
      <Card>
        <Body>{t('chooseAccountType')}</Body>
        <Button onPress={() => router.push('/account-add-hd')}>{t('addHdAccount')}</Button>
        <Button onPress={() => router.push('/account-add-private-key')}>{t('addPrivateKeyAccount')}</Button>
      </Card>
      <LinkButton onPress={() => router.back()}>{t('back')}</LinkButton>
    </Screen>
  );
}
