
import axios from "axios";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function listModelsRaw() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is missing.");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    console.log(`Fetching models from: https://generativelanguage.googleapis.com/v1beta/models`);
    const response = await axios.get(url);

    console.log("✅ Models available for this API Key:");
    if (response.data && response.data.models) {
      response.data.models.forEach((m: any) => {
        console.log(` - ${m.name} (Supported methods: ${m.supportedGenerationMethods})`);
      });
    } else {
      console.log("No models found in response.", response.data);
    }

  } catch (error: any) {
    console.error("❌ Error fetching models:");
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data:`, error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

listModelsRaw();
