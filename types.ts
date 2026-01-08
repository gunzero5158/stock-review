
export type Language = 'en' | 'ja' | 'zh';

export type DataSourceType = 'MOCK' | 'CUSTOM_API';

export type GeminiModelType = 'gemini-3-flash-preview' | 'gemini-3-pro-preview';

export interface AppConfig {
  dataSource: DataSourceType;
  apiUrl: string; // e.g., "http://localhost:5000/api/quote"
  geminiBaseUrl?: string; // Optional custom endpoint for Gemini API
  geminiModel: GeminiModelType;
}

export interface StockDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ma5?: number;
  ma10?: number;
  ma20?: number;
  vma5?: number; // Volume Moving Average 5
  vma20?: number; // Volume Moving Average 20
  
  // MACD
  macd?: number;
  signal?: number;
  hist?: number;
  
  // RSI
  rsi?: number;
  
  // KDJ
  k?: number; // KDJ K
  d?: number; // KDJ D
  j?: number; // KDJ J

  // Bollinger Bands
  bollUpper?: number;
  bollMid?: number; // Usually same as MA20
  bollLower?: number;

  // Magic 9 (DeMark Setup)
  // Positive value (1 to 9) = Bullish Setup count (Price < 4 days ago) -> Red 9 implies potential Bottom
  // Negative value (-1 to -9) = Bearish Setup count (Price > 4 days ago) -> Green 9 implies potential Top
  magic9?: number; 
}

export enum AnalysisScore {
  STRONG_SELL = 0,
  SELL = 1,
  WEAK_SELL = 2,
  HOLD = 3,
  WEAK_BUY = 4,
  BUY = 5,
  STRONG_BUY = 5 // Cap at 5 for simplicity
}

export interface TechnicalIndicatorStatus {
  name: string;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  value?: string;
  description: string;
}

export interface AIAnalysisResult {
  symbol: string;
  price: string;
  score: number;
  trend: 'UP' | 'DOWN' | 'SIDEWAYS';
  support: string;
  resistance: string;
  recommendation: string; // e.g., "Buy at dip", "Wait"
  detailedAnalysis: string;
  indicators: TechnicalIndicatorStatus[];
  sources: { title: string; uri: string }[];
}

// Removed AI_SEARCH step
export type LoadingStep = 'IDLE' | 'FETCH_DATA' | 'CALCULATE_INDICATORS' | 'GENERATING_REPORT';

export interface AppState {
  loadingStep: LoadingStep; // Replaces simple boolean isLoading
  error: string | null;
  data: AIAnalysisResult | null;
  chartData: StockDataPoint[];
}