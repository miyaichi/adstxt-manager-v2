# プロジェクト現状ステータスと残課題 (2025-12-16現在)

## 1. プロジェクト概要
**Project Name**: Ads.txt Manager V2  
**Current Phase**: Feature Expansion (i18n, Analytics)  
**Main Components**: 
- Backend (Node.js/Hono/PostgreSQL)
- Frontend (Next.js/React/Tailwind)

## 2. 実装完了機能 (Status: ✅ Implemented)

### Backend
- **Ads.txt Scanning**: 指定ドメインのAds.txtのフェッチ、パース、バリデーション、DB保存。
- **Sellers.json Ingestion**: 大規模なSellers.jsonのストリーム処理とDBへの取り込み、トランザクション安全性の確保。
- **Monitoring & Scheduler**: 
  - Cronジョブによる定期スキャン (Ads.txt)。
  - Ads.txt内の新規ドメインに対するSellers.jsonの自動検知・取得。
  - バグ修正済み: スケジューラーの再実行防止フラグ修正。
- **API Endpoints**: 
  - `/api/adstxt/validate`: Ads.txtの検証。
  - `/api/sellers`: Sellers.jsonデータの検索 (Trigram Index導入済み)。
  - `/api/analytics`: OpenSincera API連携 (リトライ・キャッシュ機能付き)。

### Frontend
- **Seller Search**: 高速なSellers.json検索インターフェース。
- **Ads.txt Validator**: ドメインまたはテキスト貼り付けによるAds.txt検証機能。
- **Monitor Dashboard**: モニタリング対象ドメインの管理画面、スキャン履歴表示。
- **Sellers Status**: 自動取得されたSellers.jsonの取得ステータス一覧表示。
- **Environment**: Docker Composeによる開発環境の確立。

## 3. 残課題・今後のタスク (Remaining Tasks)

### 優先度: 高 (High) - Feature Roadmap
1.  **Internationalization (i18n) Support**: 🚀 Next
    - アプリケーションの多言語対応 (英語/日本語)。
    - `frontend/src/lib/i18n` の既存実装を活用・拡張。
2.  **Validation Codes / Warning Page**:
    - バリデーションエラー詳細ページの作成。

### 優先度: 中 (Medium)
3.  **UI/UXの改善**: 🔄 In Progress
    - 提供機能の洗い出しと実装方針の策定（レスポンシブ対応、ローディング表示、エラーハンドリング改善など）。
4.  **テストカバレッジの向上**:
    - Backendのユニットテスト拡充。
    - FrontendのE2Eテスト導入（Playwrightなど）。

### 優先度: 低 (Low) / 将来的な検討事項
5.  **認証・認可 (Auth)**:
    - ダッシュボードへのアクセス制限が必要な場合。
6.  **通知機能**:
    - 重要な更新やエラーの通知。

## 4. 完了した技術的改善 (Technical Improvements)
- ✅ **Fix Scheduler Logic**: スケジューラーが一度しか実行されないバグを修正。
- ✅ **Resolve Schema Drift**: `monitored_domains` テーブルに `file_type` カラムを追加し複合主キー化。
- ✅ **Reliable Bulk Import**: `sellers_catalog` の取り込みを DELETE->COPY トランザクションに変更し、主キー競合を解消。
- ✅ **Database Indexing**: `sellers_catalog` にTrigram Indexを追加し検索を高速化。
- ✅ **API Proxy Reliability**: 外部API呼び出しにリトライ、タイムアウト、キャッシュを追加。
- ✅ **Sellers.json Display Improvements**: `seller_domain` と `identifiers` のサポートを追加し、表示不具合を修正。

---
**Next Actions**:
1. Internationalization (i18n) Support の実装。
2. Validation Codes ページの公開。
