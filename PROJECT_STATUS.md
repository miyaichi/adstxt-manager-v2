
# プロジェクト現状ステータスと残課題 (2025-12-13現在)

## 1. プロジェクト概要
**Project Name**: Ads.txt Manager V2  
**Current Phase**: Development (Core Features Implemented)  
**Main Components**: 
- Backend (Node.js/Hono/PostgreSQL)
- Frontend (Next.js/React/Tailwind)

## 2. 実装完了機能 (Status: ✅ Implemented)

### Backend
- **Ads.txt Scanning**: 指定ドメインのAds.txtのフェッチ、パース、バリデーション、DB保存。
- **Sellers.json Ingestion**: 大規模なSellers.jsonのストリーム処理とDBへの取り込み。HTTPステータス/ETagの保存に対応。
- **Monitoring & Scheduler**: 
  - Cronジョブによる定期スキャン (Ads.txt)。
  - Ads.txt内の新規ドメインに対するSellers.jsonの自動検知・取得。
- **API Endpoints**: 
  - `/api/adstxt/validate`: Ads.txtの検証。
  - `/api/sellers`: Sellers.jsonデータの検索。
  - `/api/sellers/files`: Sellers.json取得履歴の確認。
  - `/api/monitor`: モニタリング対象ドメインの管理（CRUD）。

### Frontend
- **Seller Search**: 高速なSellers.json検索インターフェース。
- **Ads.txt Validator**: ドメインまたはテキスト貼り付けによるAds.txt検証機能。
- **Monitor Dashboard**: モニタリング対象ドメインの管理画面、スキャン履歴表示。
- **Sellers Status**: 自動取得されたSellers.jsonの取得ステータス一覧表示。
- **Environment**: Docker Composeによる開発環境の確立。

## 3. 残課題・今後のタスク (Remaining Tasks)

### 優先度: 高 (High)
1.  **本番環境デプロイ構成 (Production Deployment)**: ✅ Completed
    - GCP (Cloud Run + Cloud SQL) へのデプロイ構成を確立。
    - GitHub Actionsによる自動デプロイ (CI/CD) を実装済み。
2.  **エラーハンドリングとリトライ戦略の強化**: ✅ Completed
    - `axios-retry` を導入し、ネットワークエラー、5xxエラー、429 Too Many Requests に対する指数バックオフリトライを実装。
    - 全ての外向きHTTPリクエスト (`adstxt_scanner`, `stream_importer`, `api/adstxt`) を共通のHTTPクライアント経由に統一。
3.  **データクリーンアップ処理**: ✅ Completed
    - 定期実行で溜まり続ける `raw_sellers_files` (30日経過) や `ads_txt_scans` (90日経過) の古いデータを削除するジョブを実装。
    - 毎日深夜 3:00 に実行されるようスケジューリング。

### 優先度: 中 (Medium)
4.  **UI/UXの改善**:
    - モバイル対応の微調整。
    - ローディング表示やエラーメッセージのユーザーフレンドリー化。
5.  **テストカバレッジの向上**:
    - Backendのユニットテスト拡充（特にスケジューラー周り）。
    - FrontendのE2Eテスト導入（Playwrightなど）。
6.  **認証・認可 (Auth)**:
    - 現状は認証なし。ダッシュボードへのアクセス制限が必要な場合、Auth.js (NextAuth) 等の導入検討。

### 優先度: 低 (Low) / 将来的な検討事項
7.  **Sellers.json パースの最適化**:
    - 現在はストリーム処理だが、さらに大規模なデータに対してのパフォーマンスチューニング。
8.  **通知機能**:
    - Ads.txtの内容に不備が見つかった場合や、重要なSellers.jsonの更新があった場合のメール/Slack通知。

## 4. 未決定事項 (Open Questions)

- **デプロイ先**: GCP (Cloud Run + Cloud SQL) に決定済み。
- **認証仕様**: 認証機能を実装するか、VPN/Basic認証等で簡易的に済ませるか。
- **データ保存期間**: スキャン履歴をいつまで保持するかのポリシー。

---
**Next Actions**:
1. 本番デプロイ方針の決定。
2. データ保全ポリシー（バックアップ/削除）の策定。
