import type { TranslationKey } from "../popup/i18n.js";
import type { ApprovalRequest } from "./types.js";

export interface ApprovalSummaryRow {
  readonly label: TranslationKey;
  readonly value: string;
}

type Translate = (key: TranslationKey) => string;

export const approvalSummary = (approval: ApprovalRequest, t: Translate): readonly ApprovalSummaryRow[] => {
  const rows: ApprovalSummaryRow[] = [
    {
      label: "approvalChainNetwork",
      value: `${approval.scope.chain.toUpperCase()} ${approval.scope.network.toUpperCase()}`,
    },
    {
      label: "approvalAccount",
      value: `${approval.account.name}\n${approval.account.identities[approval.scope.chain].address}`,
    },
  ];

  if (approval.type === "transaction") {
    rows.push(
      { label: "approvalTransaction", value: approval.inspection.schema },
      { label: "approvalRecipients", value: approval.inspection.recipients.join("\n") || t("approvalNone") },
      { label: "approvalExternalState", value: t("approvalNotChecked") },
    );
  }
  if (approval.type === "message") {
    rows.push(
      { label: "approvalPurpose", value: approval.messageParams.purpose },
      { label: "approvalExpires", value: approval.messageParams.expiresAt },
    );
  }
  return rows;
};
