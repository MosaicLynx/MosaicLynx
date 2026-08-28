# Generic Phase Review Gates

各ゲートは README が利用者向け documentation として正確で、最初の利用を妨げず、対象の現在の capability と制約を誤解なく伝えるかを確認する。

1. Accuracy: name、installation、import、API、引数、戻り値、configuration、version、対応環境、capability の説明が source と一致する。
2. Usability: 利用者が必要な prerequisite を満たし、最初の利用まで進める。
3. Constraint accuracy: current、unsupported、planned、security、platform、compatibility、保証範囲を誤解なく区別する。
4. Consistency: README、public contract、manifest、実装、仕様、設定、test、license、links に利用を妨げる矛盾がない。
5. Structure: 最初の利用に必要な情報が、内部仕様や不要な詳細に埋もれていない。

すべての generic gate が合格し、ERROR / WARN がなければ `READY` とする。NIT だけなら `READY WITH MINOR FIXES`、ERROR / WARN または利用・理解を妨げる欠陥があれば `REVISE README` とする。

repository instructions が追加する mandatory gate、required evidence、security / release policy、命名規約は repository-specific policy として別途適用する。この資料へ repository 固有の gate や product contract を追加しない。追加 policy が不明な場合は、確認できない状態を PASS としない。
