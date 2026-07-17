import { describe, expect, it } from 'vitest';

import { approvalSummary } from '../src/approval/summary.js';
import type { ApprovalRequest } from '../src/approval/types.js';
import { en } from '../src/popup/locales/en.js';
import { ja } from '../src/popup/locales/ja.js';

const account = {
  id: 'account-1',
  name: 'Account A',
  identities: {
    symbol: { address: 'TALICE', publicKey: 'A' },
    nem: { address: 'NALICE', publicKey: 'B' },
  },
};

const base = {
  id: 'approval-1',
  origin: 'https://app.example',
  originAscii: 'https://app.example',
  scope: { chain: 'symbol', network: 'testnet' },
  profile: { id: 'profile-1', network: 'testnet' },
  vaultRevision: 1,
  account,
  createdAt: '2026-01-01T00:00:00.000Z',
  expiresAt: '2026-01-01T00:05:00.000Z',
};

describe('approval summary', () => {
  it('uses localized labels and fallback text for transaction details', () => {
    const approval = {
      ...base,
      type: 'transaction',
      payload: '00',
      inspection: { schema: 'Transfer V1', recipients: [], warnings: [], externalStateUnverified: [] },
    } as unknown as ApprovalRequest;

    const english = approvalSummary(approval, (key) => en[key]);
    const japanese = approvalSummary(approval, (key) => ja[key]);

    expect(english).toContainEqual({ label: 'approvalRecipients', value: 'None' });
    expect(japanese).toContainEqual({ label: 'approvalRecipients', value: 'なし' });
    expect(english).toContainEqual({ label: 'approvalExternalState', value: 'Not checked' });
    expect(japanese).toContainEqual({ label: 'approvalExternalState', value: '未照合' });
  });

  it('includes message-specific fields without changing their values', () => {
    const approval = {
      ...base,
      type: 'message',
      availableAccounts: [account],
      messageParams: { ...base.scope, purpose: 'Sign in', nonce: 'nonce', expiresAt: '2026-01-01T00:05:00.000Z' },
    } as unknown as ApprovalRequest;

    expect(approvalSummary(approval, (key) => en[key], account as never)).toEqual(
      expect.arrayContaining([
        { label: 'approvalAccount', value: 'Account A\nTALICE' },
        { label: 'approvalPurpose', value: 'Sign in' },
        { label: 'approvalExpires', value: '2026-01-01T00:05:00.000Z' },
      ])
    );
    expect(approvalSummary(approval, (key) => en[key])).not.toContainEqual(
      expect.objectContaining({ label: 'approvalAccount' })
    );
  });
});
