import axios from 'axios';

interface BraveSearchParams {
  q: string;
  country?: string;
  search_lang?: string;
  ui_lang?: string;
  count?: number;
  offset?: number;
  safesearch?: 'off' | 'moderate' | 'strict';
  freshness?: 'pd' | 'pw' | 'pm' | 'py' | string;
  text_decorations?: boolean;
  spellcheck?: boolean;
  result_filter?: string;
  goggles_id?: string;
  units?: 'metric' | 'imperial';
  extra_snippets?: boolean;
  summary?: boolean;
}

export interface BraveSearchResponse {
  type: 'search';
  query: {
    original: string;
    show_strict_warning: boolean;
    altered: string;
    safesearch: boolean;
    is_navigational: boolean;
    is_geolocal: boolean;
    local_decision: string;
    local_locations_idx: number;
    is_trending: boolean;
    is_news_breaking: boolean;
    ask_for_location: boolean;
    language: string;
    spellcheck_off: boolean;
    country: string;
    bad_results: boolean;
    should_fallback: boolean;
    lat: string;
    long: string;
    postal_code: string;
    city: string;
    state: string;
    header_country: string;
    more_results_available: boolean;
    custom_location_label: string;
    reddit_cluster: string;
    summary_key: string;
  };
  // Define other response fields as necessary
}

export class BraveSearchAPI {
  private apiKey: string;
  private baseUrl: string = 'https://api.search.brave.com/res/v1/web/search';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(params: BraveSearchParams): Promise<BraveSearchResponse> {
    try {
      const response = await axios.get<BraveSearchResponse>(this.baseUrl, {
        params,
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': this.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching search results: ${error}`);
    }
  }
}
