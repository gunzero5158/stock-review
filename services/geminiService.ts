import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, Language, StockDataPoint, AppConfig } from '../types';
import { normalizeSymbol, aggregateToWeekly } from './stockService';

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    symbol: { type: Type.STRING },
    price: { type: Type.STRING },
    score: { 
      type: Type.NUMBER, 
      description: "Actionability Score (0-5). 0=Strong Sell/Avoid, 2.5=Hold/Wait (Risk is high), 5=Strong Buy Opportunity. NOT just trend direction." 
    },
    trend: { type: Type.STRING, enum: ["UP", "DOWN", "SIDEWAYS"] },
    support: { type: Type.STRING, description: "Identified support price levels" },
    resistance: { type: Type.STRING, description: "Identified resistance price levels" },
    recommendation: { type: Type.STRING, description: "Short term actionable advice" },
    detailedAnalysis: { type: Type.STRING, description: "Deep analysis including Patterns, Fibonacci, Elliott Wave, Chan Theory, Bollinger, Magic 9, RSI and KDJ." },
    indicators: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          signal: { type: Type.STRING, enum: ["BULLISH", "BEARISH", "NEUTRAL"] },
          value: { type: Type.STRING, description: "The numeric value or state" },
          description: { type: Type.STRING }
        }
      }
    }
  },
  required: ["symbol", "score", "trend", "support", "resistance", "recommendation", "detailedAnalysis", "indicators"]
};

const getLanguageName = (lang: Language): string => {
  switch (lang) {
    case 'zh': return 'Chinese (Simplified)';
    case 'ja': return 'Japanese';
    default: return 'English';
  }
};

export const analyzeStock = async (
    rawQuery: string, 
    lang: Language, 
    contextData: StockDataPoint[], 
    config: AppConfig,
    isMockData: boolean = false
  ): Promise<AIAnalysisResult> => {
  
  const query = normalizeSymbol(rawQuery);
  const clientOptions: any = { apiKey: process.env.API_KEY };
  
  if (config.geminiBaseUrl && config.geminiBaseUrl.trim().length > 0) {
    clientOptions.baseUrl = config.geminiBaseUrl.trim();
  }

  const ai = new GoogleGenAI(clientOptions);
  // Use selected model from config, fallback to flash
  const model = config.geminiModel || "gemini-3-flash-preview"; 
  const targetLang = getLanguageName(lang);
  
  let promptContext = "";
  if (contextData && contextData.length > 0) {
    // Header: Date, Open, High, Low, Close, Vol, MACD_Hist, RSI, K, Boll_Up, Boll_Low, Magic9
    const dailyCSV = contextData.slice(-30).map(d => 
      `${d.date},${d.open},${d.high},${d.low},${d.close},${d.volume},${d.hist?.toFixed(3)},${d.rsi?.toFixed(1)},${d.k?.toFixed(1)},${d.bollUpper?.toFixed(2)},${d.bollLower?.toFixed(2)},${d.magic9}`
    ).join("\n");
    
    // Header: Date, Open, High, Low, Close
    const weeklyData = aggregateToWeekly(contextData);
    const weeklyCSV = weeklyData.slice(-12).map(w => 
      `${w.date},${w.open},${w.high},${w.low},${w.close}`
    ).join("\n");

    const latest = contextData[contextData.length - 1];
    const volumeRatio = latest.vma5 ? (latest.volume / latest.vma5).toFixed(2) : "N/A";
    
    if (isMockData) {
       promptContext = `WARNING: SIMULATED DATA.`;
    } else {
      promptContext = `
      CONTEXT DATA (Real Market Data via API):
      Symbol: ${query}
      Latest Price: ${latest.close}
      Latest Volume Ratio: ${volumeRatio}x (vs 5-day avg)
      
      === DAILY DATA (Last 30 Days) ===
      Format: Date,Open,High,Low,Close,Vol,MACD_Hist,RSI,K,Boll_Up,Boll_Low,Magic9
      ${dailyCSV}

      === WEEKLY CHART (Last 12 Weeks) ===
      Format: Date,Open,High,Low,Close
      ${weeklyCSV}
      `;
    }
  }

  const prompt = `
    Act as a Senior Technical Analyst specialized in Asian and US markets. Perform a DEEP analysis for: "${query}".
    ${promptContext}

    **Strictly DO NOT** search for news. Rely ONLY on the provided price/indicator data.

    1. **Primary Oscillators (Mandatory)**:
       - **RSI**: Is it Overbought (>70) or Oversold (<30)? Is there Divergence?
       - **KDJ**: Check for Golden Cross (Buy) or Dead Cross (Sell).

    2. **Chart Patterns & Morphology**:
       - Analyze the sequence of Highs and Lows in the provided daily/weekly data.
       - **Identify Classic Patterns**: Look for specific setups like "Cup and Handle", "Head and Shoulders" (Top/Bottom), "Double Top/Bottom", "Bullish/Bearish Flags", or "Wedges".
       - **Trend Structure**: Higher Highs/Higher Lows (Up) or Lower Highs/Lower Lows (Down).

    3. **Key Levels & Fibonacci Analysis**:
       - Calculate implied **Fibonacci Retracement** levels based on the recent significant High/Low range from the data.
       - Identify if current price is near a Golden Ratio level (0.618 or 0.382) acting as support or resistance.
       - Combine these with integer support/resistance levels.

    4. **Advanced Analysis Frameworks**:
       - **Bollinger Bands**: Is the price hugging the Upper Band (Breakout) or reverting to Mean?
       - **Magic 9 (DeMark)**: Check for Reversal signals (9).
       - **Elliott Wave**: Identify wave structure (Impulse vs Correction).
       - **Chan Theory (缠论)**: Identify structural fractals if applicable.

    5. **SCORING LOGIC (CRITICAL)**:
       - The 'score' (0.0 to 5.0) represents the **Risk/Reward Ratio for a NEW BUY ENTRY**, NOT just the trend direction.
       - **Score 4.5 - 5.0**: Strong Signal. Pattern Breakout (e.g., Cup & Handle breakout) or Deep Support Bounce (Fib 0.618). Low Risk.
       - **Score 2.5 - 3.5**: Neutral / Hold. Trend might be UP, but price is too high (Overbought), or Trend is Sideways. **Wait for pullback.**
       - **Score 0.0 - 2.0**: Sell / Avoid. Pattern Breakdown (e.g., Head & Shoulders neckline break) or Bearish Divergence.
       - **Example**: If Trend is UP but RSI > 80 (Overbought) and you recommend "Don't chase high" or "Take Profit", the Score MUST be **< 3.0** (Neutral/Sell), NEVER 5.0.

    6. **Determine**:
       - A technical score (based on logic above).
       - **Key Support and Resistance levels** (Label them, e.g., "Support at $100 (Fib 0.5)").
       - A clear, actionable recommendation (e.g., "Wait for pullback to...", "Buy at market", "Reduce position").
    
    7. **Formatting & Language Rules**:
       - **CRITICAL**: The output fields 'detailedAnalysis', 'recommendation', 'support', 'resistance', and **especially** the 'description' field inside the indicators array MUST be in **${targetLang}**.
       - If ${targetLang} is Chinese, use Simplified Chinese for all descriptions.
       - 'trend' and 'signal' fields MUST remain in ENGLISH enum format (e.g., "BULLISH", "BEARISH").
       - **detailedAnalysis**: Must integrate insights from Patterns, Fibonacci, RSI, KDJ, and Wave theory.

    8. Return the result strictly in JSON.
  `;

  // Retry Logic for Stability
  let lastError: any = null;
  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const timeoutMs = 85000; 
      const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`AI Analysis Request Timed Out (${timeoutMs/1000}s)`)), timeoutMs)
      );

      const apiCallPromise = ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA
        }
      });

      const response: any = await Promise.race([apiCallPromise, timeoutPromise]);
      const jsonText = response.text || "{}";
      
      let data;
      try {
          data = JSON.parse(jsonText);
      } catch (e) {
          console.warn("JSON parse failed, raw text:", jsonText);
          throw new Error("Failed to parse AI response.");
      }

      // SANITIZATION
      const sanitizedData = {
          symbol: data.symbol || query,
          price: data.price || "N/A",
          score: typeof data.score === 'number' ? data.score : 2.5,
          trend: ["UP", "DOWN", "SIDEWAYS"].includes(data.trend) ? data.trend : "SIDEWAYS",
          support: data.support || "N/A",
          resistance: data.resistance || "N/A",
          recommendation: data.recommendation || "Hold",
          detailedAnalysis: data.detailedAnalysis || "Analysis currently unavailable.",
          indicators: Array.isArray(data.indicators) ? data.indicators.map((ind: any) => ({
              name: ind.name || "Unknown",
              signal: ["BULLISH", "BEARISH", "NEUTRAL"].includes(ind.signal) ? ind.signal : "NEUTRAL",
              value: ind.value || "",
              description: ind.description || ""
          })) : [],
          sources: []
      };

      return sanitizedData;

    } catch (error: any) {
       console.warn(`Attempt ${attempt + 1} failed:`, error);
       lastError = error;
       
       if (attempt < MAX_RETRIES - 1) {
           await new Promise(r => setTimeout(r, 2000));
           continue;
       }
    }
  }

  // Final Error Handling
  console.error("Gemini Analysis Final Error:", lastError);
  if (lastError.message && (lastError.message.includes('Rpc failed') || lastError.message.includes('fetch') || lastError.message.includes('Network'))) {
      throw new Error("Network Connection Error. Please check your internet.");
  }
  
  throw new Error(lastError.message || "Analysis timed out. The market data is too complex to process quickly. Please try again.");
};