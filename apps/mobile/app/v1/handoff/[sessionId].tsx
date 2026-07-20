import type { TransactionInspection } from '@mosaiclynx/core';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { useT } from '../../../src/i18n';
import { unverifiedOriginDisplay } from '../../../src/ports';
import type { PendingHandoff } from '../../../src/relay';
import { abandonHandoff, completeSignedHandoff, failHandoff, openHandoff } from '../../../src/relay';
import { inspectTestnetRequest } from '../../../src/signing';
import { useMobileStore } from '../../../src/store';
import { Body, Button, Card, Field, LinkButton, Screen, TestnetBanner } from '../../../src/ui';

export default function HandoffApproval() {
  const rawUrl = Linking.useURL();
  const store = useMobileStore();
  const router = useRouter();
  const t = useT();
  const password = useRef('');
  const [pending, setPending] = useState<PendingHandoff>();
  const [inspection, setInspection] = useState<TransactionInspection>();
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [status, setStatus] = useState<'loading' | 'review' | 'done' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!rawUrl) return;
    let live = true;
    let handle = '';
    void openHandoff(rawUrl)
      .then((value) => {
        handle = value.handle;
        const parsed = inspectTestnetRequest(value.request);
        if (!live) {
          abandonHandoff(handle);
          return;
        }
        const matching =
          store.state?.accounts.filter(
            (account) =>
              account.identities[value.request.chain].publicKey.toUpperCase() ===
                parsed.signerPublicKey.toUpperCase() &&
              (!value.request.expectedSignerPublicKey ||
                account.identities[value.request.chain].publicKey.toUpperCase() ===
                  value.request.expectedSignerPublicKey)
          ) ?? [];
        setPending(value);
        setInspection(parsed);
        setSelectedAccountId(matching[0]?.id ?? '');
        setStatus('review');
        if (!matching.length) setMessage(t('noMatchingAccount'));
      })
      .catch(async (error: unknown) => {
        if (!live) return;
        if (handle) {
          const errorCode =
            error instanceof Error && error.message === 'SIGNER_MISMATCH' ? 'SIGNER_MISMATCH' : 'INVALID_TRANSACTION';
          await failHandoff(handle, errorCode).catch(() => undefined);
          handle = '';
        }
        setMessage(
          error instanceof Error && error.message === 'MAINNET_DISABLED' ? t('mainnetDisabled') : t('relayError')
        );
        setStatus('error');
      });
    return () => {
      live = false;
      if (handle) abandonHandoff(handle);
    };
  }, [rawUrl]);

  const accounts =
    pending && inspection
      ? (store.state?.accounts.filter(
          (account) =>
            account.identities[pending.request.chain].publicKey.toUpperCase() ===
            inspection.signerPublicKey.toUpperCase()
        ) ?? [])
      : [];
  const selected = accounts.find((account) => account.id === selectedAccountId);
  const profile = selected ? store.state?.profiles.find((item) => item.id === selected.profileId) : undefined;
  const displayedOrigin = pending ? unverifiedOriginDisplay.format(pending.request.initiatorOrigin) : undefined;
  const externalLabel = (item: string): string => {
    const keys = {
      'chain state': 'chainState',
      'mosaic metadata': 'mosaicMetadata',
      balance: 'balance',
      'multisig membership': 'multisigMembership',
    } as const;
    return item in keys ? t(keys[item as keyof typeof keys]) : item;
  };

  const reject = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await failHandoff(pending.handle, 'USER_REJECTED', true);
      setMessage(t('rejected'));
      setStatus('done');
    } catch {
      setMessage(t('relayError'));
      setStatus('error');
    } finally {
      setBusy(false);
    }
  };

  const approve = async () => {
    if (!pending || !selected || !profile) return;
    setBusy(true);
    setMessage('');
    try {
      if (!store.unlockedProfileIds.has(profile.id)) await store.unlock(profile.id, password.current);
      password.current = '';
      const signed = await store.signRelayRequest(profile.id, selected.id, pending.request);
      await completeSignedHandoff(pending.handle, signed);
      setMessage(t('signed'));
      setStatus('done');
    } catch (error) {
      const code = error instanceof Error && error.message === 'UNLOCK_FAILED' ? 'VAULT_LOCKED' : 'INVALID_TRANSACTION';
      await failHandoff(pending.handle, code).catch(() => undefined);
      setMessage(code === 'VAULT_LOCKED' ? t('invalidPassword') : t('signFailed'));
      setStatus('error');
    } finally {
      password.current = '';
      setBusy(false);
    }
  };

  return (
    <Screen title={t('transaction')}>
      <TestnetBanner text={t('testnet')} />
      {status === 'loading' ? <Body>{t('busy')}</Body> : null}
      {pending && inspection && status === 'review' ? (
        <>
          <Card>
            <Body muted>{t('requestOrigin')}</Body>
            <Body selectable>{displayedOrigin?.canonicalOrigin}</Body>
            <Body muted>{t('originNotice')}</Body>
          </Card>
          <Card>
            <Body>
              {pending.request.chain.toUpperCase()} · {inspection.schema}
            </Body>
            <Body muted>{t('fee')}</Body>
            <Body selectable>{inspection.fee}</Body>
            <Body muted>{t('signer')}</Body>
            <Body selectable>{inspection.signerPublicKey}</Body>
          </Card>
          {inspection.transfers.map((transfer, index) => (
            <Card key={`${transfer.recipient}-${index}`}>
              <Body muted>
                {t('transfer')} {index + 1}
              </Body>
              <Body>{transfer.recipient}</Body>
              {transfer.assets.map((asset) => (
                <Body key={asset.id} selectable>
                  {asset.id}: {asset.amount}
                </Body>
              ))}
              <Body muted>{t('messageHex')}</Body>
              <Body selectable>{transfer.messageHex || '—'}</Body>
            </Card>
          ))}
          <Card>
            <Body>{t('external')}</Body>
            {inspection.externalStateUnverified.map((item) => (
              <Body muted key={item}>
                • {externalLabel(item)}
              </Body>
            ))}
            {inspection.warnings.map((item) => (
              <Body key={item}>• {item}</Body>
            ))}
          </Card>
          <Card>
            <Body>{t('selectAccount')}</Body>
            {accounts.map((account) => (
              <LinkButton key={account.id} onPress={() => setSelectedAccountId(account.id)}>
                {account.id === selectedAccountId ? '✓ ' : ''}
                {account.name} · {account.identities[pending.request.chain].address}
              </LinkButton>
            ))}
            {profile && !store.unlockedProfileIds.has(profile.id) ? (
              <Field
                placeholder={t('password')}
                secureTextEntry
                onChangeText={(value) => {
                  password.current = value;
                }}
              />
            ) : null}
          </Card>
          {message ? <Body>{message}</Body> : null}
          <Button disabled={busy || !selected} onPress={() => void approve()}>
            {busy ? t('busy') : t('approve')}
          </Button>
          <Button danger disabled={busy} onPress={() => void reject()}>
            {t('reject')}
          </Button>
        </>
      ) : null}
      {status === 'done' || status === 'error' ? (
        <Card>
          <Body>{message}</Body>
          <Button onPress={() => router.replace('/home')}>{t('close')}</Button>
        </Card>
      ) : null}
    </Screen>
  );
}
