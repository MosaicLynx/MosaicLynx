import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';

import { useT } from '../src/i18n';
import { useMobileStore } from '../src/store';
import { Body, Button, Card, Field, LinkButton, Screen, TestnetBanner } from '../src/ui';

export default function Restore() {
  const store = useMobileStore();
  const router = useRouter();
  const t = useT();
  const password = useRef('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const restore = async () => {
    setBusy(true);
    setMessage('');
    let temporary: File | undefined;
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (picked.canceled) return;
      temporary = new File(picked.assets[0]!.uri);
      await store.importBackup(await temporary.text(), password.current);
      password.current = '';
      setMessage(t('backupImported'));
      router.replace('/unlock');
    } catch {
      setMessage(t('backupImportFailed'));
    } finally {
      password.current = '';
      try {
        temporary?.delete();
      } catch {
        /* Cache cleanup is best effort. */
      }
      setBusy(false);
    }
  };

  return (
    <Screen title={t('restoreBackup')}>
      <TestnetBanner text={t('testnet')} />
      <Card>
        <Body muted>{t('backupImportInfo')}</Body>
        <Field
          placeholder={t('backupPassword')}
          secureTextEntry
          onChangeText={(value) => {
            password.current = value;
          }}
        />
        <Button disabled={busy} onPress={() => void restore()}>
          {busy ? t('busy') : t('restoreBackup')}
        </Button>
      </Card>
      {message ? <Body>{message}</Body> : null}
      <LinkButton onPress={() => router.back()}>{t('back')}</LinkButton>
    </Screen>
  );
}
