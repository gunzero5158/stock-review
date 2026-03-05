import { StockDataPoint, AppConfig } from '../types';

// This is the Standard Interface your Python/Node bridge needs to return
interface ApiStockResponse {
  symbol: string;
  name?: string; // Stock Name from API (e.g. "Tencent")
  source?: string; // "FUTU" or "MOCK_FALLBACK"
  debug_error?: string;
  kline: {
    time: string; // "2023-10-27"
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
  }[];
}

export interface FetchStockResult {
  data: StockDataPoint[];
  source: 'REAL' | 'MOCK';
  symbol: string;
  name?: string; // Added verified name
}

// Helper to auto-fix user input (e.g. "700" -> "HK.00700")
export const normalizeSymbol = (input: string): string => {
  let s = input.trim().toUpperCase();
  if (s.includes('.')) return s;
  if (/^\d{1,5}$/.test(s)) return `HK.${s.padStart(5, '0')}`;
  if (/^\d{6}$/.test(s)) return s.startsWith('6') ? `SH.${s}` : `SZ.${s}`;
  if (/^[A-Z]+$/.test(s)) return `US.${s}`;
  return s;
}

// Aggregate Daily Data into Weekly Candles
export const aggregateToWeekly = (dailyData: StockDataPoint[]): Partial<StockDataPoint>[] => {
  if (!dailyData || dailyData.length === 0) return [];

  const weeklyData: Partial<StockDataPoint>[] = [];
  let currentWeek: Partial<StockDataPoint> | null = null;
  let lastWeekNum = -1;

  dailyData.forEach((day) => {
    const date = new Date(day.date);
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    const uniqueWeekId = date.getFullYear() * 100 + weekNo;

    if (lastWeekNum !== uniqueWeekId) {
      if (currentWeek) {
        weeklyData.push(currentWeek);
      }
      currentWeek = {
        date: day.date, 
        open: day.open,
        high: day.high,
        low: day.low,
        close: day.close,
        volume: day.volume
      };
      lastWeekNum = uniqueWeekId;
    } else {
      if (currentWeek) {
        currentWeek.high = Math.max(currentWeek.high!, day.high);
        currentWeek.low = Math.min(currentWeek.low!, day.low);
        currentWeek.close = day.close; 
        currentWeek.volume = (currentWeek.volume || 0) + day.volume;
      }
    }
  });

  if (currentWeek) {
    weeklyData.push(currentWeek);
  }

  return weeklyData;
};

export const fetchStockData = async (rawSymbol: string, config: AppConfig): Promise<FetchStockResult> => {
  const symbol = normalizeSymbol(rawSymbol);
  
  try {
    const isHttps = window.location.protocol === 'https:';
    const isLocalHttp = config.apiUrl.startsWith('http:') && 
                        (config.apiUrl.includes('localhost') || config.apiUrl.includes('127.0.0.1'));

    if (isHttps && isLocalHttp) {
      console.warn("Mixed Content Warning: Connecting to HTTP localhost from HTTPS.");
    }

    const response = await fetch(`${config.apiUrl}?symbol=${symbol}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const resJson: ApiStockResponse = await response.json();
    
    if (resJson.source === 'MOCK_FALLBACK') {
        throw new Error(resJson.debug_error || "Unable to retrieve real-time data from Futu. Please check OpenD connection and subscriptions.");
    }
    
    if (!resJson.kline || !Array.isArray(resJson.kline)) {
      throw new Error("Invalid API response format. Expected { kline: [] }");
    }

    if (resJson.kline.length === 0) {
        throw new Error("No K-line data returned for this symbol. Market might be closed or symbol is invalid.");
    }

    return {
      data: processRawData(resJson.kline),
      source: 'REAL',
      symbol: resJson.symbol || symbol,
      name: resJson.name // Return verified name from API if available
    };

  } catch (error: any) {
    console.error("Fetch Stock Data Error:", error);
    let userMessage = error.message;
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
       userMessage = "Connection Failed. Ensure 'bridge.py' is running on port 5000 and Futu OpenD is active.";
    }
    throw new Error(userMessage);
  }
};

const processRawData = (rawParams: any[]): StockDataPoint[] => {
  const data: StockDataPoint[] = [];
  const closes: number[] = [];
  const volumes: number[] = [];
  const highs: number[] = [];
  const lows: number[] = [];

  // Temporary arrays for KDJ calculation
  let prevK = 50;
  let prevD = 50;

  // Magic 9 variables
  let sellSetupCount = 0; // Price > P[4]
  let buySetupCount = 0;  // Price < P[4]

  rawParams.forEach((item, index) => {
    const point: StockDataPoint = {
      date: item.time,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume
    };

    closes.push(point.close);
    volumes.push(point.volume);
    highs.push(point.high);
    lows.push(point.low);
    
    const len = closes.length;
    
    // --- Moving Averages ---
    if (len >= 5) point.ma5 = avg(closes.slice(-5));
    if (len >= 10) point.ma10 = avg(closes.slice(-10));
    if (len >= 20) point.ma20 = avg(closes.slice(-20));

    // --- Volume MA ---
    if (len >= 5) point.vma5 = avg(volumes.slice(-5));
    if (len >= 20) point.vma20 = avg(volumes.slice(-20));

    // --- MACD ---
    point.rsi = calculateRSI(closes, 14); 
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    point.macd = ema12 - ema26;
    point.signal = point.macd * 0.8;
    point.hist = point.macd - point.signal;

    // --- KDJ (9, 3, 3) ---
    if (len >= 9) {
      const last9Lows = lows.slice(-9);
      const last9Highs = highs.slice(-9);
      const low9 = Math.min(...last9Lows);
      const high9 = Math.max(...last9Highs);
      const rsv = (high9 === low9) ? 50 : ((point.close - low9) / (high9 - low9)) * 100;
      const k = (2/3) * prevK + (1/3) * rsv;
      const d = (2/3) * prevD + (1/3) * k;
      const j = 3 * k - 2 * d;
      point.k = k;
      point.d = d;
      point.j = j;
      prevK = k;
      prevD = d;
    } else {
        point.k = 50; point.d = 50; point.j = 50;
    }

    // --- Bollinger Bands (20, 2) ---
    if (len >= 20) {
      const slice20 = closes.slice(-20);
      const mean = avg(slice20);
      const stdDev = Math.sqrt(slice20.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 20);
      
      point.bollMid = mean;
      point.bollUpper = mean + 2 * stdDev;
      point.bollLower = mean - 2 * stdDev;
    }

    // --- Magic 9 (DeMark Setup) ---
    if (index >= 4) {
       const close4DaysAgo = rawParams[index - 4].close;
       
       if (point.close > close4DaysAgo) {
          sellSetupCount++;
          buySetupCount = 0;
       } else if (point.close < close4DaysAgo) {
          buySetupCount++;
          sellSetupCount = 0;
       } else {
          buySetupCount = 0;
          sellSetupCount = 0;
       }

       if (sellSetupCount > 0) point.magic9 = -sellSetupCount; 
       if (buySetupCount > 0) point.magic9 = buySetupCount;   
    }

    data.push(point);
  });

  return data;
};

// Utils
function avg(arr: number[]) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    let gains = 0;
    let losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
}

function calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
        ema = prices[i] * k + ema * (1 - k);
    }
    return ema;
}