// ydcIndex.ts
import axios, { AxiosResponse } from 'axios';

interface Snippet {
    title: string;
    snippet: string;
    url: string;
}

interface ApiResponse {
    results: Snippet[];
    total: number;
    // Include other fields from the API response if necessary
}

class YDCIndex {
    private apiKey: string;
    private baseURL: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.ydc-index.io';
    }

    private get headers() {
        return {
            'X-API-Key': this.apiKey,
            'Content-Type': 'application/json',
        };
    }

    async getAiSnippetsForQuery(query: string): Promise<ApiResponse> {
        const params = { query };

        try {
            const response: AxiosResponse<ApiResponse> = await axios.get(
                `${this.baseURL}/search`,
                { headers: this.headers, params }
            );
            return response.data;
        } catch (error) {
            throw new Error(`Failed to fetch AI snippets from YDC Index API: ${error.message}`);
        }
    }
}

export default YDCIndex;
