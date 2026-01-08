import { StockDataPoint } from '../types';

// Helper to generate a random walk series for demo purposes
// This ensures that if the app falls back to mock data (e.g. for testing), KDJ charts don't crash.
export const generateMockStockData = (days: number = 60, startPrice: number = 100): StockDataPoint[] => {
  const data: StockDataPoint[] = [];
  let currentPrice = startPrice;
  const now = new Date();

  const closes: number[] = [];
  const volumes: number[] = [];
  const highs: number[] = [];
  const lows: number[] = [];

  // Temporary KDJ vars
  let prevK = 50;
  let prevD = 50;

  for (let i = days; i > 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random fluctuation
    const volatility = currentPrice * 0.02; // 2% daily volatility
    const change = (Math.random() - 0.5) * volatility;
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 1000000) + 500000;

    currentPrice = close;
    closes.push(close);
    volumes.push(volume);
    highs.push(high);
    lows.push(low);

    const point: StockDataPoint = {
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    };

    const len = closes.length;

    // Calculate simple MAs
    if (len >= 5) point.ma5 = avg(closes.slice(-5));
    if (len >= 10) point.ma10 = avg(closes.slice(-10));
    if (len >= 20) point.ma20 = avg(closes.slice(-20));

    // Volume MA
    if (len >= 5) point.vma5 = avg(volumes.slice(-5));
    if (len >= 20) point.vma20 = avg(volumes.slice(-20));
    
    // Simulate RSI 
    point.rsi = 30 + Math.random() * 40 + (change > 0 ? 5 : -5);

    // Simulate MACD
    point.macd = (point.ma5 || 0) - (point.ma20 || 0);
    point.signal = point.macd * 0.8;
    point.hist = point.macd - point.signal;

    // Simulate KDJ (Simplified logic for mock)
    if (len >= 9) {
        // Use real logic even for mock to look decent
        const last9Lows = lows.slice(-9);
        const last9Highs = highs.slice(-9);
        const low9 = Math.min(...last9Lows);
        const high9 = Math.max(...last9Highs);
        
        const rsv = (high9 === low9) ? 50 : ((close - low9) / (high9 - low9)) * 100;
        
        const k = (2/3) * prevK + (1/3) * rsv;
        const d = (2/3) * prevD + (1/3) * k;
        const j = 3 * k - 2 * d;

        point.k = k;
        point.d = d;
        point.j = j;

        prevK = k;
        prevD = d;
    } else {
        point.k = 50;
        point.d = 50;
        point.j = 50;
    }

    data.push(point);
  }

  return data;
};

const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
