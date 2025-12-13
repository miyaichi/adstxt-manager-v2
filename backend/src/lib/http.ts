import axios from 'axios';
import axiosRetry from 'axios-retry';

const client = axios.create({
  timeout: 20000, // 20s
  headers: {
    'User-Agent': 'AdsTxtManagerV2/1.0 (Bot)',
  },
});

axiosRetry(client, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000; // 1s, 2s, 3s wait
  },
  retryCondition: (error) => {
    // Retry on network errors or 5xx status codes
    // Also explicitly retry on 429 (Too Many Requests)
    if (error.response?.status === 429) {
      return true;
    }

    if (error.response?.status && error.response.status >= 500) {
      return true;
    }

    return axiosRetry.isNetworkOrIdempotentRequestError(error);
  },
  onRetry: (retryCount, error, requestConfig) => {
    console.log(`Retry attempt #${retryCount} for ${requestConfig.url}: ${error.message}`);
  },
});

export default client;
