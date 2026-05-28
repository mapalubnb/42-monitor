import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

export interface MarketOutcome {
  index: number;
  name: string;
  symbol: string;
  tokenId: string;
  image: string;
  price: number;
  volume: number;
  marketCap: number;
}

export interface Market {
  address: string;
  question: string;
  questionId: string;
  slug: string;
  status: string;
  image: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  volume: number;
  totalMarketCap: number;
  traders: number;
  categories: string[];
  subcategories: string[];
  topics: string[];
  tags: string[];
  outcomes: MarketOutcome[];
  contractVersion: number;
  collateralSymbol: string;
  curve: string;
  creator?: { address: string; name: string; image: string };
}

export interface MarketsResponse {
  data: Market[];
  pagination: { hasMore: boolean; totalResults: number };
}

export class FTClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: config.ft.apiBase,
      timeout: 10000,
    });
  }

  async getLatestMarkets(limit = 20): Promise<Market[]> {
    const resp = await this.http.get<MarketsResponse>('/api/v1/markets', {
      params: {
        status: 'live',
        order: 'created_at',
        ascending: false,
        limit,
      },
    });
    return resp.data.data;
  }

  async getMarket(address: string): Promise<Market | null> {
    try {
      const resp = await this.http.get<Market>(`/api/v1/markets/${address}`);
      return resp.data;
    } catch {
      return null;
    }
  }

  async getCategories(): Promise<any[]> {
    const resp = await this.http.get('/api/v1/markets/categories', {
      params: { limit: 100 },
    });
    return resp.data.data || resp.data;
  }
}
