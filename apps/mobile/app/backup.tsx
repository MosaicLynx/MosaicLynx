import { File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useRef, useState } from 'react';

import { useT } from '../src/i18n';
import { useMobileStore } from '../src/store';
import { Body, Button, Card, Field, LinkButton, Screen, TestnetBanner } from '../src/ui';

export default function Backup() {
  const store = useMobileStore();
  const router = useRouter();
  const t = useT();
  const exportPassword = useRef('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const profile =
    store.state?.profiles.find((item) => item.id === store.state?.settings.activeProfileId) ?? store.state?.profiles[0];
  if (!profile) return null;
  const exportFile = async () => {
    setBusy(true);
    setMessage('');
    let file: File | undefined;
    try {
      const serialized = await store.exportBackup(profile.id, exportPassword.current);
      file = new File(Paths.cache, `mosaiclynx-${profile.id}-${Date.now()}.mlxbackup`);
      file.create({ overwrite: true });
      file.write(serialized);
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: t('export') });
      setMessage(t('backupExported'));
    } catch {
      setMessage(t('backupExportFailed'));
    } finally {
      try {
        file?.delete();
      } catch {
        /* Cache cleanup is best effort. */
      }
      exportPassword.current = '';
      setBusy(false);
    }
  };
  return (
    <Screen title={t('backup')}>
      <TestnetBanner text={t('testnet')} />
      <Card>
        <Body>{t('export')}</Body>
        <Body muted>{t('backupExportInfo')}</Body>
        <Field
          placeholder={t('backupPassword')}
          secureTextEntry
          onChangeText={(value) => {
            exportPassword.current = value;
          }}
        />
        <Button disabled={busy} onPress={() => void exportFile()}>
          {busy ? t('busy') : t('export')}
        </Button>
      </Card>
      {message ? <Body>{message}</Body> : null}
      <LinkButton onPress={() => router.back()}>{t('back')}</LinkButton>
    </Screen>
  );
}
