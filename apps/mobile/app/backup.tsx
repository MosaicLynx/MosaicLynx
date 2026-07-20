import * as DocumentPicker from 'expo-document-picker';
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
  const importPassword = useRef('');
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
  const importFile = async () => {
    setBusy(true);
    setMessage('');
    let temporary: File | undefined;
    try {
      const picked = await DocumentPicker.getDocumentAsync({ type: 'application/json', copyToCacheDirectory: true });
      if (picked.canceled) return;
      temporary = new File(picked.assets[0]!.uri);
      await store.importBackup(await temporary.text(), importPassword.current);
      importPassword.current = '';
      setMessage(t('backupImported'));
      router.replace('/unlock');
    } catch {
      setMessage(t('backupImportFailed'));
    } finally {
      importPassword.current = '';
      try {
        temporary?.delete();
      } catch {
        /* Cache cleanup is best effort. */
      }
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
      <Card>
        <Body>{t('import')}</Body>
        <Body muted>{t('backupImportInfo')}</Body>
        <Field
          placeholder={t('backupPassword')}
          secureTextEntry
          onChangeText={(value) => {
            importPassword.current = value;
          }}
        />
        <Button disabled={busy} onPress={() => void importFile()}>
          {busy ? t('busy') : t('import')}
        </Button>
      </Card>
      {message ? <Body>{message}</Body> : null}
      <LinkButton onPress={() => router.back()}>{t('back')}</LinkButton>
    </Screen>
  );
}
