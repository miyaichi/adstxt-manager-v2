import { getGeminiModel } from '../lib/gemini';
import { getFieldDescription } from '../lib/metadata-descriptions';

interface PublisherMetrics {
  name: string;
  domain: string;
  avg_ads_to_content_ratio: number;
  avg_page_weight: number;
  avg_ad_refresh: number;
  reseller_count: number;
  id_absorption_rate: number;
  avg_cpu: number;
  avg_ads_in_view: number;
}

export class AdviserService {
  /**
   * Generates an advisory report based on the target publisher data and benchmark data.
   */
  static async generateReport(
    target: PublisherMetrics,
    benchmark: PublisherMetrics,
    language?: string, // Optional, defaults to "ja" internally if undefined/null or handled below
  ): Promise<string> {
    const model = getGeminiModel();

    // Ensure language is either 'en' or 'ja'
    const lang = language === 'en' ? 'en' : 'ja';
    const prompt = this.buildPrompt(target, benchmark, lang);

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating advisory report:', error);
      throw new Error('Failed to generate report from Gemini.');
    }
  }

  private static buildPrompt(target: PublisherMetrics, benchmark: PublisherMetrics, language: string): string {
    const definitions = this.getIndicatorDefinitions(language);

    if (language === 'en') {
      return `
## Role Definition
You are an expert in programmatic advertising monetization and web performance optimization.
Based on the detailed metrics provided by OpenSincera, create strategic advice for the publisher.
Provide objective, data-driven issue identification while acknowledging the publisher's efforts and maintaining a warm, motivational tone to answer.

## Indicator Definitions
In your analysis, strictly consider the definitions and business importance of the following indicators:

${definitions}

## Input Context
The user provides the following data:
1. **Target Publisher Stats**: Current figures for the target site
2. **Benchmark Stats**: Average figures for sites of similar category and scale

### Target Publisher Stats
- Name: ${target.name} (${target.domain})
- Stats:
  - Ads to Content Ratio (A2CR): ${(target.avg_ads_to_content_ratio * 100).toFixed(1)}%
  - Avg Page Weight: ${target.avg_page_weight.toFixed(2)} MB
  - Ad Refresh: ${target.avg_ad_refresh.toFixed(1)} sec
  - Reseller Count: ${target.reseller_count}
  - ID Absorption Rate: ${(target.id_absorption_rate * 100).toFixed(1)}%
  - Avg CPU Usage: ${target.avg_cpu.toFixed(1)} sec
  - Ads in View: ${target.avg_ads_in_view.toFixed(2)}

### Benchmark Stats
- Stats:
  - Ads to Content Ratio (A2CR): ${(benchmark.avg_ads_to_content_ratio * 100).toFixed(1)}%
  - Avg Page Weight: ${benchmark.avg_page_weight.toFixed(2)} MB
  - Ad Refresh: ${benchmark.avg_ad_refresh.toFixed(1)} sec
  - Reseller Count: ${benchmark.reseller_count}
  - ID Absorption Rate: ${(benchmark.id_absorption_rate * 100).toFixed(1)}%
  - Avg CPU Usage: ${benchmark.avg_cpu.toFixed(1)} sec
  - Ads in View: ${benchmark.avg_ads_in_view.toFixed(2)}

## Output Requirements
Output in English Markdown format with the following structure.

### 1. Executive Summary
- A catchphrase summarizing the site's status
- Estimated "Impression from Buyers" (e.g., Clean inventory, Premium slot needing technical improvement, etc.)
- **Comparison with Similar Sites**: Distinct advantages and disadvantages compared to the benchmark.

### 2. Priority Actions (Top 3)
- Three actions with the highest improvement effect.
- You must cite specific numbers (e.g., "Page Weight is 12MB, which is significantly heavier than the average 4MB") and provide a "reason needed for correction" based on the definition.

### 3. Detailed Analysis
- **UX and Performance**: Impact of CPU load and Page Weight on bounce rate and battery consumption.
- **Advertising Settings & Profitability**: How refresh speed and ID absorption rate affect CPM and unit price.
- **Supply Chain**: Proposals for improving transparency by organizing resellers and paths.

### 4. Future Outlook
- Present a positive future image of how the evaluation from advertisers will change if improvements are executed.
`;
    }

    // Japanese Prompt
    return `
## Role Definition
あなたはプログラマティック広告の収益化とWebパフォーマンス最適化のエキスパートです。
OpenSinceraの提供する詳細なメトリクスに基づき、パブリッシャー（媒体主）へ向けた戦略的アドバイスを作成してください。
データに基づいた客観的な課題指摘を行いつつも、パブリッシャーの努力を認め、モチベーションを高めるような温かみのあるトーンで回答してください。

## Indicator Definitions
分析にあたっては、以下の各指標の定義とビジネス上の重要性を厳密に考慮してください：

${definitions}

## Input Context
ユーザーからは、以下のデータが提供されます。
1. **Target Publisher Stats**: 対象サイトの現在の数値
2. **Benchmark Stats**: 類似したカテゴリ・規模のサイトの平均値

### Target Publisher Stats
- Name: ${target.name} (${target.domain})
- Stats:
  - Ads to Content Ratio (A2CR): ${(target.avg_ads_to_content_ratio * 100).toFixed(1)}%
  - Avg Page Weight: ${target.avg_page_weight.toFixed(2)} MB
  - Ad Refresh: ${target.avg_ad_refresh.toFixed(1)} sec
  - Reseller Count: ${target.reseller_count}
  - ID Absorption Rate: ${(target.id_absorption_rate * 100).toFixed(1)}%
  - Avg CPU Usage: ${target.avg_cpu.toFixed(1)} sec
  - Ads in View: ${target.avg_ads_in_view.toFixed(2)}

### Benchmark Stats
- Stats:
  - Ads to Content Ratio (A2CR): ${(benchmark.avg_ads_to_content_ratio * 100).toFixed(1)}%
  - Avg Page Weight: ${benchmark.avg_page_weight.toFixed(2)} MB
  - Ad Refresh: ${benchmark.avg_ad_refresh.toFixed(1)} sec
  - Reseller Count: ${benchmark.reseller_count}
  - ID Absorption Rate: ${(benchmark.id_absorption_rate * 100).toFixed(1)}%
  - Avg CPU Usage: ${benchmark.avg_cpu.toFixed(1)} sec
  - Ads in View: ${benchmark.avg_ads_in_view.toFixed(2)}

## Output Requirements
以下の構成で、日本語のMarkdown形式で出力してください。

### 1. 総合評価 (Executive Summary)
- サイトの状態を一言で表すキャッチフレーズ
- 推定される「バイヤーからの印象」（例：クリーンな在庫、技術的改善が必要なプレミアム枠など）
- **類似サイトとの比較**: ベンチマークと比較して、特筆すべき優位点と劣位点。

### 2. 重要課題トップ3 (Priority Actions)
- 最も改善効果が高いアクションを3つ。
- 必ず具体的な数値（例：「Page Weightが12MBと、平均の4MBより著しく重い」など）を引用し、定義に基づいた「なぜ直すべきか」の理由を添えること。

### 3. 詳細分析
- **UXとパフォーマンス**: CPU負荷やPage Weightが直帰率やバッテリー消費に与える影響。
- **広告設定と収益性**: リフレッシュ速度やID補完率が、CPMや単価に与えている影響。
- **サプライチェーン**: リセラー数やパスの整理による透明性向上の提案。

### 4. 未来への展望
- 改善を実行した場合に、広告主からどのように評価が変わるか、ポジティブな将来像を提示。
`;
  }

  private static getIndicatorDefinitions(language: string): string {
    const keyMapping: Record<string, string> = {
      'Ads to Content Ratio (A2CR)': 'avgAdsToContentRatio',
      'Ads in View': 'avgAdsInView',
      'Ad Refresh': 'avgAdRefresh',
      'ID Absorption Rate': 'idAbsorptionRate',
      'Avg Page Weight': 'avgPageWeight',
      'Avg CPU Usage': 'avgCpu',
      'Reseller Count': 'resellerCount',
      'Supply Paths': 'totalSupplyPaths',
    };

    const validLang = language === 'en' ? 'en' : 'ja';

    return Object.entries(keyMapping)
      .map(([displayName, lookupKey]) => {
        const description = getFieldDescription(lookupKey, validLang);
        return `- **${displayName}**: ${description}`;
      })
      .join('\n');
  }
}
