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
    detailedAnalysis: { type: Type.STRING, description: "Professional technical analysis report (MAXIMUM 600 words). Organized into multiple paragraphs. Separate paragraphs with a SINGLE newline only. No headings." },
    indicators: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          signal: { type: Type.STRING, enum: ["BULLISH", "BEARISH", "NEUTRAL"] },
          value: { type: Type.STRING, description: "VERY SHORT numeric value or state (max 20 chars). E.g. 'RSI: 72', 'Golden Cross'. Do NOT include long text." },
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
    // Header: Date,Open,High,Low,Close,Vol,MA5,MA20,DIF,DEA,Hist,RSI,K,Boll_Up,Boll_Low,Magic9
    // We strictly format numbers to save token space and ensure clarity
    const dailyCSV = contextData.slice(-30).map(d => 
      `${d.date},${d.open},${d.high},${d.low},${d.close},${d.volume},${d.ma5?.toFixed(2)||''},${d.ma20?.toFixed(2)||''},${d.macd?.toFixed(3)||''},${d.signal?.toFixed(3)||''},${d.hist?.toFixed(3)||''},${d.rsi?.toFixed(1)},${d.k?.toFixed(1)},${d.bollUpper?.toFixed(2)},${d.bollLower?.toFixed(2)},${d.magic9||0}`
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
      Format: Date,Open,High,Low,Close,Vol,MA5,MA20,MACD_DIF,MACD_DEA,MACD_Hist,RSI,K,Boll_Up,Boll_Low,Magic9
      ${dailyCSV}

      === WEEKLY CHART (Last 12 Weeks) ===
      Format: Date,Open,High,Low,Close
      ${weeklyCSV}
      `;
    }
  }

  const prompt = `
    Act as a Senior Technical Analyst specialized in Asian and US markets. Perform a CONCISE analysis for: "${query}".
    ${promptContext}

    **Strictly DO NOT** search for news. Rely ONLY on the provided price/indicator data.

    1. **Trend & Structure**:
       - **Moving Averages**: Analyze Price vs MA5 vs MA20. Identify Bullish Alignment (Long) or Death Cross (Short).
       - **Timeframe Continuity**: Does the Weekly Chart support the Daily trend?

    2. **Divergence Analysis (CRITICAL)**:
       - **Concept**: Compare Price Highs/Lows vs Indicator Highs/Lows.
       - **RSI & KDJ Divergence**: Check standard divergence logic. This is the STRONGEST signal.

    3. **Primary Oscillators**:
       - **MACD (KEEP CONCISE)**: Check Zero Line status and recent Crossovers. **Do not explain how MACD works**. Just state the signal (e.g. "DIF crossed above DEA"). Keep this part brief (max 2 sentences).
       - **RSI**: Overbought (>70) or Oversold (<30)?
       - **KDJ**: Golden Cross (Buy) or Dead Cross (Sell).

    4. **Chart Patterns & Morphology**:
       - **Identify Classic Patterns**: Cup and Handle, Head and Shoulders, Double Top/Bottom, Triangles, Flags.
       - **Candlestick Math**: Look for long wicks (rejection) or large body candles (conviction) at key levels.

    5. **Key Levels**:
       - **Fibonacci**: Calculate retracement levels (0.382, 0.5, 0.618) from recent swing high/low.
       - **Bollinger Bands**: Price tagging Upper Band (Strength/Overextended) or Lower Band (Bounce).
       - **Magic 9**: Check for sequential 9 signals.

    6. **SCORING LOGIC**:
       - Score 0-5 based on **Risk/Reward for NEW ENTRY**.
       - **Score 5**: Trend Up + Bullish Divergence + Breakout.
       - **Score 0**: Trend Down + Bearish Divergence + Breakdown.
       - **Score 2-3**: High RSI (>80) + Divergence (Risk of pullback).

    7. **Determine**:
       - Technical Score.
       - Support/Resistance Levels (with reasoning, e.g., "Fib 0.5").
       - Actionable Recommendation.

    8. **Formatting & Language Rules**:
       - **detailedAnalysis**: Write a **professional technical analysis report (MAXIMUM 600 words)**.
         - **STRICT PARAGRAPHING**: You MUST separate different topics (Trend, Divergence, Patterns, Conclusion) into distinct paragraphs.
         - **NO BLANK LINES**: Separate paragraphs using a **SINGLE newline character (\\n)**. Do NOT use double newlines (\\n\\n).
         - **NO HEADINGS**: Do not use Markdown headings (##) or bullet points. Just flow of text.
         - **STYLE**: Dense, professional, data-driven.
         - **MACD RESTRICTION**: Keep the MACD portion short. Devote more space to Trend and Divergence.
         - **LENGTH CHECK**: Do NOT exceed 600 words. Be concise.
       - Output fields 'detailedAnalysis', 'recommendation', 'support', 'resistance', and 'description' MUST be in **${targetLang}**.
       - 'trend'/'signal' remain ENGLISH.

    9. Return the result strictly in JSON.
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