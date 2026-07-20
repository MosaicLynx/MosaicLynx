import { generateMnemonic } from '@mosaiclynx/chain-symbol';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useT } from '../src/i18n';
import { useMobileStore } from '../src/store';
import { Body, Button, Card, Field, LinkButton, Row, Screen, TestnetBanner, usePalette } from '../src/ui';

type Step = 'welcome' | 'details' | 'backup' | 'confirm' | 'import';

export default function Onboarding() {
  const store = useMobileStore();
  const router = useRouter();
  const t = useT();
  const colors = usePalette();
  const [step, setStep] = useState<Step>('welcome');
  const [mode, setMode] = useState<'new' | 'import'>('new');
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const name = useRef('');
  const password = useRef('');
  const hint = useRef('');
  const mnemonic = useRef('');
  const words = mnemonic.current.trim().split(/\s+/).filter(Boolean);
  const candidates = useMemo(
    () =>
      words.map((word, index) => ({ word, index })).sort((a, b) => a.word.localeCompare(b.word) || a.index - b.index),
    [step, mnemonic.current]
  );

  const details = () => (
    <>
      <Field
        accessibilityLabel={t('profileName')}
        placeholder={t('profileName')}
        onChangeText={(value) => {
          name.current = value;
        }}
      />
      <Field
        accessibilityLabel={t('password')}
        placeholder={t('password')}
        secureTextEntry
        textContentType="newPassword"
        onChangeText={(value) => {
          password.current = value;
        }}
      />
      <Field
        accessibilityLabel={t('passwordHint')}
        placeholder={t('passwordHint')}
        onChangeText={(value) => {
          hint.current = value;
        }}
      />
    </>
  );

  const continueDetails = () => {
    setError('');
    if (!name.current.trim() || password.current.length < 12) {
      setError(t('detailsRequired'));
      return;
    }
    if (mode === 'new') {
      mnemonic.current = generateMnemonic();
      setStep('backup');
    } else setStep('import');
  };

  const finish = async () => {
    setBusy(true);
    setError('');
    try {
      if (mnemonic.current.trim().split(/\s+/).length !== 24) throw new Error('INVALID_MNEMONIC');
      await store.createProfile({
        name: name.current,
        password: password.current,
        passwordHint: hint.current,
        mnemonic: mnemonic.current,
      });
      mnemonic.current = '';
      password.current = '';
      router.replace('/unlock');
    } catch {
      setError(t('createFailed'));
    } finally {
      mnemonic.current = '';
      password.current = '';
      setBusy(false);
    }
  };

  return (
    <Screen title={t('welcome')}>
      <TestnetBanner text={t('testnet')} />
      {step === 'welcome' && (
        <>
          <Body>{t('intro')}</Body>
          <Button
            onPress={() => {
              setMode('new');
              setStep('details');
            }}
          >
            {t('create')}
          </Button>
          <Button
            onPress={() => {
              setMode('import');
              setStep('details');
            }}
          >
            {t('restore')}
          </Button>
        </>
      )}
      {step === 'details' && (
        <Card>
          {details()}
          <Button onPress={continueDetails}>{t('next')}</Button>
          <LinkButton onPress={() => setStep('welcome')}>{t('back')}</LinkButton>
        </Card>
      )}
      {step === 'import' && (
        <Card>
          <Body>{t('importWords')}</Body>
          <Field
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel={t('importWords')}
            placeholder={t('importWords')}
            onChangeText={(value) => {
              mnemonic.current = value;
            }}
            style={{ minHeight: 140, textAlignVertical: 'top' }}
          />
          <Button disabled={busy} onPress={() => void finish()}>
            {busy ? t('busy') : t('complete')}
          </Button>
          <LinkButton onPress={() => setStep('details')}>{t('back')}</LinkButton>
        </Card>
      )}
      {step === 'backup' && (
        <Card>
          <Body>{t('backupWords')}</Body>
          <Body muted>{t('backupWarning')}</Body>
          <View accessibilityLabel={t('backupWords')} style={{ gap: 8 }}>
            {words.map((word, index) => (
              <Body key={`${word}-${index}`} selectable>
                {index + 1}. {word}
              </Body>
            ))}
          </View>
          <Button onPress={() => setStep('confirm')}>{t('next')}</Button>
          <LinkButton
            onPress={() => {
              mnemonic.current = '';
              setStep('details');
            }}
          >
            {t('back')}
          </LinkButton>
        </Card>
      )}
      {step === 'confirm' && (
        <Card>
          <Body>{t('confirmWords')}</Body>
          <Body muted>{selected.map((index) => words[index]).join(' ') || '—'}</Body>
          <Row>
            {candidates
              .filter(({ index }) => !selected.includes(index))
              .map(({ word, index }) => (
                <Pressable
                  key={index}
                  accessibilityRole="button"
                  onPress={() => setSelected((value) => [...value, index])}
                  style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 9 }}
                >
                  <Text style={{ color: colors.text }}>{word}</Text>
                </Pressable>
              ))}
          </Row>
          <LinkButton onPress={() => setSelected([])}>{t('reset')}</LinkButton>
          <Button
            disabled={busy || selected.length !== 24 || selected.some((value, index) => value !== index)}
            onPress={() => void finish()}
          >
            {busy ? t('busy') : t('complete')}
          </Button>
          <LinkButton
            onPress={() => {
              setSelected([]);
              setStep('backup');
            }}
          >
            {t('back')}
          </LinkButton>
        </Card>
      )}
      {!!error && (
        <Body>
          <Text style={{ color: colors.danger }}>{error}</Text>
        </Body>
      )}
    </Screen>
  );
}
