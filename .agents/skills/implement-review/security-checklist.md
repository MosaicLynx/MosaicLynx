# Implementation Security Checklist

この checklist は、MosaicLynx の Extension、SDK、Relay、chain adapter、backup / protocol package と、
外部 `symbol-nem-wallet-core` / Binding の契約境界を対象とする Implementation Review の詳細観点である。
実装が上流で確立された security property、architecture、外部契約を安全に満たしているかを確認する。
新しい製品要求、Requirement、Design、Specification、API、policy、暗号方式を定義しない。

変更から protected asset と attack surface を先に特定し、対象に適用できる項目だけを確認する。
全項目を機械的なチェックボックスとして適用・出力しない。

## A. 適用範囲と保護対象

- 変更された app / package、公開 export、直接依存、生成物、test / fixture を特定する。
- Mnemonic、private key、derived secret、Profile password、復号済み Wallet Store、署名権限、暗号化保存データ、承認情報を保護対象として特定する。
- 取扱いが opaque である Wallet Store、Pending Profile、backup envelope、Relay encrypted payload の境界を確認する。
- Protected asset に触れない変更へ、不要な secret checklist を機械的に適用しない。

## B. Trust boundary と責任

変更に適用される境界について、入力、出力、秘密情報、validation、ownership、failure の責任を確認する。

- Browser Extension の privileged code / storage / approval UI
- SDK、Provider、Web page / dApp caller
- Relay / transport と encrypted payload
- chain adapter、backup / protocol package
- 外部 `symbol-nem-wallet-core` と、その Native C ABI / WASM Binding（対象に含む場合）
- persistent storage、external node / service、host browser environment

Extension、SDK、Relay、chain adapter が外部 wallet-core の鍵管理・秘密情報処理・raw signing の責任を
代替していないか、Relay が opaque と定義された payload を解釈・改変していないかを確認する。

## C. Secret ownership と lifecycle

Mnemonic、private key、derived secret、Profile password、復号済み Store について、次を実装と上流資料へ追跡する。

- 生成、import、restore、導出、unlock、使用、署名、保存、replacement、削除、lock、失敗、再起動・復旧の owner
- 不要な JavaScript object、Buffer、Uint8Array、例外、ログ、debug 出力へのコピー
- 署名機の外へ secret を出していないか、外部 wallet-core から返る値を必要以上に保持していないか
- failure、例外、timeout、partial update 後に secret または signing capability が残らないか
- `zeroize` が自動的に JavaScript heap、Browser storage、structured clone、ログを消去すると仮定していないか

具体的な消去 API の選択だけでは finding にせず、実際の leakage path、lifetime、asset impact がある場合に採用する。

## D. Authentication / authorization / approval

- unlock、restore、delete、replace、export、sign の認証条件を、実装と仕様で照合する。
- Account、Profile、origin、request、signing authority の対応付けを検証前に確定していないか確認する。
- dApp caller の要求だけで privileged action や signing を許可していないか確認する。
- approval UI の表示対象と実際に署名する payload / Account が一致しているか確認する。
- 認証・認可・origin 検証失敗時に、署名、保存、状態変更が継続しないか確認する。

## E. Input / parser / resource boundary

次の attacker-controlled input が、検証前に信頼境界を越えていないか確認する。

- Provider request、Web page message、origin、RPC body
- Wallet Store、Pending Profile、backup envelope、password、imported secret
- Relay encrypted payload、serialized transaction、message、unknown version / field
- external node response、Native C ABI / WASM Binding input（対象に含む場合）

malformed、truncated、invalid length、duplicate、unknown、oversized、深い nesting、wrong chain / network、
tampered input を fail-closed に扱い、攻撃者入力で例外、無限処理、過大なメモリ・CPU使用、partial state が
生じないか確認する。parser、decoder、schema validator、resource limit の実装と検証範囲が対象に対応しているか確認する。

## F. Cryptography / signing / protocol

- 仕様で定めた cryptographic primitive、KDF、AEAD、AAD、nonce、salt、乱数、tag の結果を確認する。
- fixed nonce、予測可能な乱数、認証前の復号結果の利用、認証結果の無視、秘密値の誤った比較がないか確認する。
- signing target、canonical bytes、domain separation、chain / network binding、Account / signer の一致を確認する。
- custom cryptographic arithmetic、独自 serialization、byte order、数量・精度の扱いに correctness defect がないか確認する。
- Symbol と NEM、Mainnet と Testnet、SDK API と protocol contract を混同していないか確認する。
- 互換性の根拠は `docs/specifications/chain-compatibility-spec.md` と固定 fixture、必要な公式資料へ追跡する。

現行の SDK 基準は `@nemnesia/symbol-sdk` `3.3.2-pure.2` である。依存を確認するときは package manifest と
lockfile を正本とし、別 version や実行環境の global package を根拠にしない。

## G. Persistence / opaque data / atomicity

- Wallet Store、Profile、backup、Relay payload を仕様に反して部分更新・意味解釈・再構成していないか確認する。
- replacement 成功前に old state を破壊していないか、失敗時に既存の正常状態を保てるか確認する。
- secret と metadata、Account と Profile、chain / network context が片側だけ更新されないか確認する。
- storage、cache、extension messaging、retry、restart、browser termination 後の状態を確認する。
- opaque bytes は不明な version、tag、field を成功として通さず、仕様が許す場合を除いて編集しない。

## H. Extension / Provider / Relay

- Provider request の origin、capability、request id、replay、response 対応が検証されているか確認する。
- content script、service worker、extension page、approval UI の境界で privileged message を偽造できないか確認する。
- approval の表示内容と signer が処理する canonical payload が一致するか確認する。
- Relay は暗号文を中継・短期保管する範囲に留まり、秘密鍵・復号 payload・署名権限を不必要に受け取らないか確認する。
- Relay の timeout、duplicate、replay、eviction、failure が署名や承認の安全性を弱めないか確認する。

## I. External wallet-core Binding

Native C ABI / WASM Binding が変更対象に含まれる場合だけ適用する。

- C ABI の borrowed input、owned output、length、free、error、panic の境界を仕様と実装で照合する。
- WASM / JavaScript の `Uint8Array`、object、例外、初期化、公開 export、秘密情報の露出を確認する。
- Binding が外部 wallet-core の鍵管理、導出、暗号、署名の意味を再実装・改変していないか確認する。
- use-after-free、double-free、未初期化 output、length 不一致、入力の再利用、意図しない secret export を確認する。
- Binding が対象に含まれない変更では、Native / WASM 項目を適用外として記録する。

## J. Error / logging / observability

- private key、Mnemonic、password、復号データ、token、credential、署名対象の秘密部分をログや例外へ含めない。
- error、warning、telemetry、analytics、debug、snapshot、test failure が秘密情報を漏らさないか確認する。
- malformed、認証失敗、wrong chain / network、timeout、external service failure を成功や承認済みとして表現していないか確認する。
- error mapping が外部契約を変更したり、失敗理由から秘密情報を推測可能にしたりしていないか確認する。

## K. Dependencies / build / runtime

- 依存追加・version・feature・bundler設定が security、公開 export、chain compatibility、runtime boundary を変えていないか確認する。
- workspace package の依存方向、private package、生成 asset、extension bundle、browser / Node runtime の差異を確認する。
- 未確認の registry、external node、browser runtime、Binding runtime、長時間検証を成功扱いしない。
- 単に dependency が古い、coverage が低い、一般的 hardening がないという理由だけで finding にしない。

## L. Test / fixture / oracle

- 正常系だけでなく、malformed、truncated、wrong password、wrong chain / network、tamper、duplicate、unknown、resource limit を確認する。
- Extension の origin / approval / privileged message、Relay の opaque encrypted payload、SDK の transport 差異を対象に応じて確認する。
- signing bytes、address、公開鍵、HD導出、serialization は独立した fixed vector、公式資料、別実装 oracle と照合する。
- fixture が実装ロジックの単純な複製でなく、出典・network・chain・version を記録しているか確認する。
- secret-bearing fixture、snapshot、test output が repository や package に不要に残らないか確認する。

## M. Finding の採用条件

checklist の項目があるだけでは finding にしない。正式 finding は、次のすべてを満たす候補に限る。

1. Requirements、Design、Specification、適用可能な ADR、公式 protocol / schema、または差分に追跡できる。
2. 現在の変更に具体的な protected asset、外部契約、互換性、memory / boundary safety の影響がある。
3. 実装が既存の security property または契約を破っている。
4. 再現条件、attack path、影響、完了条件を説明できる。
5. 任意の新機能、policy、暗号方式、hardening、将来構想を要求していない。

実装の正否を判定する契約自体が不足・矛盾している場合は、`Implementation defect` と断定せず、
`Specification ambiguity`、`Specification gap`、`Implementation → Specification feedback` として分離する。
一方、private key / Mnemonic leakage、nonce reuse、AEAD authentication bypass、誤った signing bytes、
既存の ownership / boundary safety の破綻など、既存条件を具体的に破る defect は、仕様に防御方法が
逐語的にないことだけを理由に見逃さない。
