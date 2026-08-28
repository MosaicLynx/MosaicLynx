# Reviewers

メインエージェントは Review Board Chair として、対象確定、根拠管理、候補統合、重大度・状態、gate、成果物を担当する。Phase 1 では次の4観点を独立して確認する。

## Reviewer A: 構造と責務

purpose、scope、system context、component responsibility、data ownership、dependency direction、循環依存、境界、変更責任を確認する。

## Reviewer B: Security と trust boundary

secret / sensitive data、untrusted input、trust boundary、authentication / authorization、integrity、fail-closed、secret-bearing / signing-capable activity、remote / external / opaque system の責任を確認する。具体的な cryptographic algorithm は、approved source に根拠がある場合を除き要求しない。

## Reviewer C: Flow、lifecycle、concurrency、運用

主要 flow、state、lifecycle、初期化、終了、再起動、failure、retry、timeout、duplicate、concurrency、resource、retention、availability、operational responsibility、外部連携を確認する。対象外の将来運用機能を追加しない。

## Reviewer D: Traceability と downstream handoff

requirements、specification、ADR、repository instructions への traceability、下位仕様への委譲、validation、implementation feasibility、未決定事項を確認する。API field、schema、function signature、private implementation の詳細不足は、design 欠陥としない。

## Chair の採用基準

基本設計で決めるべき responsibility、dependency、boundary、ownership、flow、lifecycle、invariant、または approved source との矛盾であり、対象箇所、根拠、影響、必要条件、完了条件を説明できるものだけを採用する。方式の好み、未要求の capability、下位工程の詳細は却下する。
