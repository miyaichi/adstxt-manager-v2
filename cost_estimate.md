
• 前提

  - 東京リージョン、Cloud Run（常時稼働 API/フロント）、Cloud SQL for
    PostgreSQL、Artifact Registry、Cloud Scheduler/Run Jobs での定期取り込み。
  - Gemini API (AI Advisor機能) は Gemini 2.0 Flash を想定。入力トークン約2k、出力約1k/回。
  - ストレージは 50–100GB SSD、ログ標準保持。ネットワーク egress は米国外向けを
    想定。為替・割引無しの概算。

  小規模検証（リクエスト少、cron 低頻度、AI分析 月100回程度）

  - Cloud Run: 0.1 vCPU / 256–512MB、常時 1 インスタンス相当で ~$25–40
  - Cloud SQL: db-custom-2-8192 以上が望ましいが検証なら db-f1-micro〜db-custom-
    1-3840 で ~$40–80（SSD 50GB 含む）
  - Gemini API: ~$0.1 (無料枠の範囲内または極めて少額)
  - Artifact Registry/ログ/Network egress: ~$10–20
  - 合計目安: $80–140/月

  中規模（1–3 インスタンス常駐、毎時取り込み、数十万リクエスト/月、AI分析 月10,000回程度）

  - Cloud Run: 0.5 vCPU / 1GB、同時 1–3 で ~$120–200
  - Cloud SQL: db-custom-2-8192（2vCPU/8GB）、SSD 100GB で ~$180–250
  - Gemini API: ~$2–5 (Gemini 2.0 Flash: 入力/出力ともに安価で、1.5 Flashと同等またはそれ以下のコスト効率を想定)
  - NAT/egress（数百 GB 外向け）、Artifact Registry、Cloud Scheduler/Jobs: ~$50–
    120
  - 合計目安: $352–575/月

  大規模（ピーク時スケールアウト、毎分取り込み、数百万リクエスト/月、AI分析 月100,000回程度）

  - Cloud Run: 1 vCPU / 2GB、同時 5–10 常駐で ~$400–800（ピークはさらに上振れ）
  - Cloud SQL: db-custom-4-16384 以上、SSD 200GB+ で ~$400–700
  - Gemini API: ~$20–50 (利用頻度による変動大)
  - ネットワーク egress（>1TB）、NAT、Cloud Scheduler/Jobs、Artifact Registry/ロ
    グ拡張: ~$150–300
  - 合計目安: $970–1,850+/月

  コスト抑制のポイント

  - Cloud Run の最小インスタンス数を下げ、Jobs で cron を分離し必要時のみ起動。
  - Cloud SQL は I/O が律速しやすいので CPU/メモリを下げるよりストレージ性能を
    確保。
  - Gemini API は 2.0 Flash モデルを使用することで高性能かつ低コスト運用が可能。プロンプトの最適化（キャッシュ活用など）も検討。
  - Egress が大きいと急増するので、取り込み先のリージョンを合わせる・圧縮転送を
    活用。
  - ログ保持期間やサンプリングを調整して Logging/Monitoring コストを抑制。
