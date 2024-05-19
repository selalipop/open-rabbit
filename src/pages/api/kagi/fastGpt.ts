// fastgpt.ts
import axios, { AxiosResponse } from 'axios';

interface FastGPTAnswer {
  output: string;
  references: Reference[];
  tokens: number;
}

interface Reference {
  title: string;
  snippet: string;
  url: string;
}

interface FastGPTRequest {
  query: string;
  cache?: boolean;
  web_search?: boolean;
}

class FastGPT {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseURL = 'https://kagi.com/api/v0/fastgpt';
  }

  private get headers() {
    return {
      'Authorization': `Bot ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async answerQuery(query: string, cache: boolean = true, web_search: boolean = true): Promise<FastGPTAnswer> {
    if (web_search !== true) {
      throw new Error("The web_search parameter is currently out of service and may be removed. Only 'true' is allowed.");
    }

    const data: FastGPTRequest = {
      query,
      cache,
      web_search,
    };

    try {
      const response: AxiosResponse<{data: FastGPTAnswer}> = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log("FastGPT response.data", response.data.data)
      return response.data.data;
    } catch (error) {
      throw new Error(`Failed to fetch data from FastGPT API: ${error.message}`);
    }
  }
}

export default FastGPT;
