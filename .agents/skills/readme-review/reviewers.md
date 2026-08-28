# Reviewers

README review は、複数 persona の討議を成果物へ出力しない。メインエージェントが Chair として、次の3パスを独立して実施する。サブエージェントを使った場合だけ実行情報を記録する。

## Reviewer A: Facts と public contract

manifest / metadata、workspace、public export、型、実装、sample と README の name、import、API / command、引数、戻り値、環境、version、設定を照合する。

## Reviewer B: 利用開始

purpose、prerequisite、installation、最小例、configuration、最初の利用までの導線を確認する。実行していない example を動作確認済みと書かない。

## Reviewer C: Constraints と overclaim

current / unsupported / planned capability、security guidance、platform requirement、external dependency、compatibility、license、migration、保証範囲、内部詳細の過剰記載を確認する。README の責務を越える product / implementation change は要求しない。

## Chair の採用基準

README の誤り、README に必要な情報の不足、または README が利用者を具体的に誤誘導する問題だけを採用する。対象箇所、事実、approved source、影響、必要条件、完了条件が揃わないもの、API や product を変更する提案は採用しない。
