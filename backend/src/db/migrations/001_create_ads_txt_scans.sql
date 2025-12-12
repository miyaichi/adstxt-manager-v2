-- Ads.txt 履歴保存用テーブル
CREATE TABLE IF NOT EXISTS ads_txt_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    content TEXT, -- ads.txtのRawデータ
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status_code INTEGER,
    error_message TEXT,
    
    -- 検索・一覧表示用キャッシュ（詳細は都度計算可能だが、一覧で重くならないように）
    records_count INTEGER DEFAULT 0,
    valid_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ads_txt_scans_domain_scanned_at ON ads_txt_scans(domain, scanned_at DESC);
