# authentication-development-plan.md

## 1. 目的と前提
現行スタック（Next.js 16 / Hono API / PostgreSQL / Cloud Run）に沿って、契約ドメインベースの会員向け認証を実装する。ユーザー体験はSSO優先、未導入企業にはメールパスワードレスを提供し、ドメイン失効時には即座にアクセスを遮断する。

## 2. 採用スタック（実装現実性を考慮）
- **Runtime / Framework**: Node.js 20 + TypeScript、Hono(API) / Next.js 16(App Router)。
- **Authライブラリ**: Auth.js (NextAuth) をNextフロントで利用し、JWTセッションを発行。
- **IDP連携**: Google / Azure AD (OpenID Connect)。Auth.js の OAuth Provider で統合。
- **パスワードレス**: Auth.js Email Provider でマジックリンク（または6桁OTP）を送信。
- **DB**: PostgreSQL (Cloud SQL) に契約ドメイン・ユーザー・マジックリンク/OTPの状態を保存。
- **トークン共有**: Auth.js の署名シークレットをHono APIと共有し、JWTをAPIミドルウェアで検証。HttpOnly + Secure Cookie 配送。

## 3. 認証フロー（Next.js UI + Hono API）
1. **Email入力**: Next.jsのサインイン画面でメールを受け付け、`/api/auth/domain-lookup` で契約ドメインを判定。
2. **分岐**:
   - **SSOあり**: Google/AzureのOAuthへリダイレクト（テナントID指定可）。
   - **SSOなし**: Email Providerでマジックリンク（またはOTP）を送信。
3. **コールバック**: Auth.js がJWTセッションを発行し、Cookieに格納。ペイロードに `email`, `domain_id`, `company_name`, `is_active` を含める。
4. **APIアクセス**: フロントはHono APIにリクエスト。API側のJWTミドルウェアが署名検証後、PostgreSQLで `contract_domains.status` を再チェックし、無効なら401を返却。
5. **セッション更新**: 短期JWT + ローテーション。Auth.jsの`session`コールバックで定期的に`contract_domains`を再参照して強制失効を反映。

## 4. データ設計（PostgreSQL）
- **contract_domains**: `id (uuid)`, `domain (unique)`, `company_name`, `status (active|suspended|terminated)`, `idp_type (google|azure|none)`, `azure_tenant_id (nullable)`, `email_regex_allowlist (nullable)`。
- **users**: `id (uuid)`, `email (unique)`, `domain_id (fk)`, `last_authenticated_at`, `last_verified_at`。
- **magic_links / otp_codes**: `id`, `email`, `domain_id`, `code_hash`, `expires_at`, `consumed_at`, `ip_hint`（リプレイ検知用）。
- **audit_logs (任意)**: `user_id`, `event`, `at`, `ip`（不正アクセス調査用）。

## 5. 実装フェーズ
### Phase 1: スキーマと環境準備
- `contract_domains` / `users` / `magic_links` テーブルをSQLマイグレーションで追加（Cloud SQL前提、ローカルはdocker-composeのPostgres）。
- 環境変数: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `AZURE_CLIENT_ID/SECRET`, `AZURE_TENANT_ID (複数ドメインならDBで管理)`, `EMAIL_FROM`, `EMAIL_SMTP_*`。

### Phase 2: Hono API 側の認可基盤
- 共通JWTミドルウェアでAuth.js署名を検証し、`domain_id`をキーにPostgreSQLで`status`をチェック。
- ドメイン設定取得API (`/auth/domain-lookup?email=`) を実装し、NextフロントがSSO/メールどちらか判定できるようにする。

### Phase 3: Next.js 認証UX
- Auth.js をApp Routerで設定。カスタムサインインページでメール入力→domain-lookup→SSO/メール分岐。
- Email Providerでマジックリンク/OTP送信（送信文面に会社名・有効期限・サポート連絡先を記載）。
- サインイン後のリダイレクトで`status !== active`を即時ブロックし、サインアウトさせるガードを追加。

### Phase 4: 運用・デプロイ
- Cloud Run (Next/Hono) で同一`NEXTAUTH_SECRET`を注入。Cloud SQL Proxy経由でPostgreSQLに接続。
- Cookie属性: `Secure`, `HttpOnly`, `SameSite=Lax` (必要に応じて`None`+HTTPS)。
- 監査: アクセスログに`domain_id`と`user_id`を載せ、セキュリティイベントをStackdriverに集約。

### Phase 5: セキュリティ・SLO
- セッションTTL短期(例: 8〜12h) + アイドルタイムアウト。ドメイン`status`確認は各リクエストで必須。
- フリードメイン/一時メールのバリデーション（`psl`ライブラリでサブドメインを正規化済み）。
- 退職・契約終了は`contract_domains.status`更新のみで即時遮断。ユーザー個別停止は`users.status`(拡張)で対応。

## 6. 未確定事項・要決定項目
- **メール送信基盤**: SMTP（SendGrid/Postmark等）か、社内既存の送信サービスか。

  * 現在インフラはGoogle Workspace + Google Cloudのみ。社内専用送信サービスなし。実装時にSMTPプロバイダを決定し、日英テンプレートを準備する前提で進行。

- **SSOテナント管理**: 複数テナントを扱う場合、`contract_domains`に`azure_tenant_id`を持たせる運用で問題ないか。

  * 同一企業が複数Azure ADテナントを利用する場合でも、契約ドメイン単位で独立管理するため、`contract_domains`への`azure_tenant_id`保持で運用。

- **OTPかマジックリンクか**: UXとセキュリティ要件に応じてどちらを優先するか。

	* 利便性重視でマジックリンクを基本採用。期限は短め（例: 10〜15分）。期限切れ時は再ログインを許可。メール遅延時のフォールバックとしてOTPを用意するかは実装時に判断。

- **監査要件**: 監査ログの保持期間、エクスポート先（BigQuery/Cloud Logging）をどうするか。

	* 現状はCloud Logging→Cloud Storageなど安価ストレージのみで十分。日/月などでファイル名を分かりやすくし、90日超は手動削除運用。

- **ロール/権限**: ドメイン単位のViewer/Adminなどの権限を持たせるか、現状は単一ロールでよいか。

	* 現状は単一ロールで開始。管理画面は無しまたは最小限。

- **多言語対応**: 認証メールの文面を英日対応するか。

	* サイトが英日対応のため、認証メールも英日テンプレートを用意する方針。
