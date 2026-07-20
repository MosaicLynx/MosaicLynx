import { useRouter } from 'expo-router';

import { useT } from '../src/i18n';
import { useMobileStore } from '../src/store';
import { Body, Card, LinkButton, Row, Screen, TestnetBanner } from '../src/ui';

export default function Settings() {
  const store = useMobileStore();
  const router = useRouter();
  const t = useT();
  return (
    <Screen title={t('settings')}>
      <TestnetBanner text={t('testnet')} />
      <Card>
        <Body>{t('language')}</Body>
        <Row>
          <LinkButton onPress={() => void store.setLanguage('ja')}>日本語</LinkButton>
          <LinkButton onPress={() => void store.setLanguage('en')}>English</LinkButton>
        </Row>
      </Card>
      <Card>
        <Body>{t('theme')}</Body>
        <Row>
          <LinkButton onPress={() => void store.setTheme('system')}>{t('system')}</LinkButton>
          <LinkButton onPress={() => void store.setTheme('light')}>{t('light')}</LinkButton>
          <LinkButton onPress={() => void store.setTheme('dark')}>{t('dark')}</LinkButton>
        </Row>
      </Card>
      <Card>
        <Body>{t('version')}</Body>
        <Body muted>{t('capabilityDisabled')}</Body>
      </Card>
      <LinkButton onPress={() => router.back()}>{t('back')}</LinkButton>
    </Screen>
  );
}
