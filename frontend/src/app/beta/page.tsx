import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"

const markdownContent = `
# Public Beta へようこそ

Transparency Toolkit はAPTI(Advertisers and Publishers Transparency Initiative)の会員向けサービスとして開発しており、現在、**パブリックベータ版**として公開されています。
このフェーズでは、機能の安定性確認と、ユーザーの皆様からのフィードバックに基づいた改善を目的としています。

[Transparency Tool Kit](https://adstxt-frontend-893655878736.asia-northeast1.run.app/)

## Implemented Features (実装されている主な機能)

現在、以下の機能をご利用いただけます：

### 🔍 Validator & Explorer
- **Ads.txt Validator**: 入力ドメインの Ads.txt / App-ads.txt をフェッチし、パースと行単位のバリデーションを実行します。致命的エラーと警告が分類され、問題のある行は原因と推奨修正案付きで一覧表示されます。登録済みの Sellers.json とクロスチェックし、存在しない Seller ID や誤ったリレーション（DIRECT/RESELLER）を検知します。
- **Data Explorer**: Ads.txt / App-ads.txt / Sellers.json のデータを高速検索し、SellerID、ドメイン、販売形態（DIRECT/RESELLER）、認証ステータスなどで絞り込みができます。検索結果から各 Seller の詳細（関連 SSP、Cret ID、Sellers.json での登録情報）にドリルダウンし、結果をダウンロードできます。

### ⚡ Optimizer
- **Ads.txt Optimizer**: Ads.txt / App-ads.txt のバリデーション結果を元に、重複行や無効行の削除、フォーマットの正規化、DIRECT/RESELLER の自動修正を６ステップで提案します。提案はプレビュー画面で確認でき、実際の修正を行う・コメントアウトするなどの対応を行った上で新しい Ads.txt / App-ads.txt をダウンロードできます。

  1. Cleanup
    フォーマットエラー、重複行、無効なコメントを処理します。また、大文字小文字、改行コードの統一などフォーマットも行います。

  2. Owner Domain
    OWNERDOMAINが指定されたドメインと一致することを確認します。見つからない場合は追加されます。

  3. Manager Domain 最適化
    古くなった、または不要なMANAGERDOMAINエントリを解決します。
    
  4. 関係性の修正
    sellers.jsonデータに基づいてDIRECT/RESELLERの関係性を修正します。

  5. Sellers.json 検証
    アップストリームのsellers.jsonファイルで検証できないエントリを削除します。

  6. 認証局IDの検証
    sellers.jsonデータに基づいて、認証局ID（4番目のフィールド）を検証・修正します。

### 📊 Analytics
- **Insite Analytics**: OpenSincera API と連携し、パブリッシャーのパフォーマンスメトリクスを可視化します。ID 吸収率（直接性）、広告対コンテンツ比率、広告更新頻度、ユニーク広告枠数、ページ重量、CPU 使用率、供給経路数、リセラー数などの技術指標を分析できます。これらのデータを基に、Gemini AI がパブリッシャ向けの改善提案（優先度・実装手順付き）を生成し、ベンチマークと比較しながら具体的な改善策を提示します。

### 📋 Scan Status
- **スキャン状況**: Ads.txt / App-ads.txt / Sellers.json の過去のスキャン結果を一覧表示します。各スキャンの実行日時、ステータスコード、レコード数、有効/警告件数を確認でき、バックグラウンドで実行されたスキャンの履歴を追跡できます。

## Feedback (フィードバックについて)

私たちは、より良いツールを開発するために、皆様からの声を大切にしています。
バグの報告、機能リクエスト、その他お気づきの点がございましたら、ぜひお知らせください。

### フィードバックの送り先
- **GitHub Issues**: バグ報告や機能提案は [GitHub Issues](https://github.com/miyaichi/Transparency-Toolkit/issues) までお願いします。
- **お問い合わせ**: その他のお問い合わせは、yoshihiko.miyaichi@pier1.co.jp または、https://www.facebook.com/miyaichi まで直接ご連絡ください。

皆様のご協力に感謝いたします！
`

export default function BetaPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8">
        <article className="prose prose-slate dark:prose-invert lg:prose-lg max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {markdownContent}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  )
}
