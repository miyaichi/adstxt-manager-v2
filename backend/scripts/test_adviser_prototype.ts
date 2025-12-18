
import dotenv from "dotenv";
import path from "path";
import { AdviserService } from "../src/services/adviser";

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  console.log("Running Adviser Prototype...");

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in .env file.");
    process.exit(1);
  }

  // Data from USER_REQUEST (Forbes) as Target
  const targetData = {
    name: "Forbes",
    domain: "forbes.com",
    avg_ads_to_content_ratio: 0.15686,
    avg_ads_in_view: 1.05345, // Note: This value > 1 seems odd for percentage, but using as is directly from raw data or normalizing? usually 0-1. Assuming raw ratio here.
    avg_ad_refresh: 56.085,
    total_unique_gpids: 93.27273,
    id_absorption_rate: 0.555,
    avg_page_weight: 14.452,
    avg_cpu: 59.45994,
    reseller_count: 1537,
  };

  // Mock Benchmark Data (Improved slightly better than target to simulate gap)
  const benchmarkData = {
    name: "Industry Average",
    domain: "benchmark",
    avg_ads_to_content_ratio: 0.10, // Better (Lower)
    avg_ads_in_view: 0.80,
    avg_ad_refresh: 45.0,
    reseller_count: 800, // Better (Lower)
    id_absorption_rate: 0.70, // Better (Higher)
    avg_page_weight: 8.5, // Better (Lighter)
    avg_cpu: 30.5, // Better (Lower)
    total_unique_gpids: 100,
  };

  console.log("Generating report for:", targetData.name);
  console.log("Comparing against benchmark...");

  try {
    const report = await AdviserService.generateReport(targetData, benchmarkData);
    console.log("\n================ REPORT START ================\n");
    console.log(report);
    console.log("\n================ REPORT END ================\n");
  } catch (err) {
    console.error("Failed to generate report:", err);
  }
}

main();
