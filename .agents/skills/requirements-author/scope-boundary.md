# Requirements Scope Boundary

要件候補を採用する前に、次の問いで phase と scope を確認する。

1. これは purpose、scope、responsibility、constraint、quality、external behavior、acceptance、または必要な failure behavior を明確にする要求か。
2. これは requirements で決めるべきことか。それとも design、specification、implementation で決めるべき詳細か。
3. ユーザーの依頼、承認済み資料、適用可能な repository instructions にない user、environment、domain、platform、network、external system、responsibility、compatibility、operational behavior を追加していないか。
4. その要求が他の承認済み要求から論理的に導かれる場合、導出元と影響範囲を示せるか。示せない場合は未決定として残すべきではないか。

## Requirements review candidates

- user / stakeholder / actor / external system の責任。
- target、scope、non-goal、environment、domain、platform、network の境界（適用される場合）。
- 目的、外部から観測できる結果、成功条件、利用可能性。
- security、privacy、integrity、authenticity、authorization、availability、interoperability。
- failure、invalid / malformed / unsupported input、recovery、retry、duplicate、timeout、retention（対象に関係する場合）。
- acceptance criteria、validation evidence、assumption、risk、undecided item。

## Requirements では決めないもの

根拠のある上流決定を反映する場合を除き、次は requirements で新たに固定しない。

- API field、type、schema、wire format、serialization、canonicalization、database schema。
- algorithm、cryptographic parameter、KDF、nonce、key encoding、signature encoding、具体的な protocol message。
- component の分割、dependency direction、class、function、framework、library、package、deployment。
- 実装手順、fixture の具体値、test case の実装、CI / release command。

技術的な詳細が必要な場合は、requirements では目的・制約・検証可能な結果を記述し、具体化先の design / specification / implementation と参照関係を示す。
