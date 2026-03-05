import { Language } from '../types';

export const translations: Record<Language, any> = {
  en: {
    title: "Stock",
    titleSuffix: "Analyst",
    placeholder: "e.g. HK.00700, US.AAPL, 1024",
    analyze: "Analyze",
    howItWorks: "How it works & Data Requirements",
    readyTitle: "Ready to Analyze",
    readyDesc: "Enter a stock symbol to generate a comprehensive technical report using AI and real market data.",
    
    // Loading Steps
    steps: {
      fetch: "Connecting to Market Data API...",
      identify: "Verifying Stock Identity (Gemini Search)...", 
      calc: "Computing KDJ, MACD, RSI & Volume...",
      gen: "AI Technical Analyst: Synthesizing Report...",
    },

    // Signal Translations
    signals: {
      bullish: "Bullish",
      bearish: "Bearish",
      neutral: "Neutral"
    },

    errorTitle: "Analysis Failed",
    errorDesc: "Failed to analyze stock. Please try again.",
    currentPrice: "Current Price",
    trend: "Trend",
    recommendation: "Recommendation",
    techScore: "Technical Score",
    scoreRange: "0 (Bearish) - 5 (Bullish)",
    keyLevels: "Key Levels",
    resistance: "Resistance (Pressure)",
    support: "Support (Safety)",
    resistanceDesc: "* Resistance: Selling pressure expected.",
    supportDesc: "* Support: Buying interest expected.",
    aiInsight: "Technical Analyst Insight", // Changed from AI Insight
    indicators: "Indicator Signals",
    sources: "Sources",
    charts: {
      title: "Price & Indicators",
      price: "Price",
      histogram: "Histogram",
      overbought: "Overbought",
      oversold: "Oversold"
    },
    gauge: {
      strongSell: "Strong Sell",
      sell: "Sell",
      neutral: "Neutral",
      buy: "Buy",
      strongBuy: "Strong Buy",
      label: "Bullish Score"
    },
    modal: {
      title: "Service Data Requirements",
      productionReq: "To build a production-grade version of this technical analysis service, you would need the following resources:",
      req1: "Real-Time Market Data API (e.g., Bloomberg, Alpha Vantage) for OHLCV data.",
      req1Note: "This tool connects to Futu OpenD via a local Python bridge.",
      req2: "Calculation Engine (e.g., TA-Lib, pandas-ta) to compute indicators mathematically.",
      req3: "Historical Data (200+ days) for long-term averages.",
      req4: "AI Layer (Gemini) for interpretation.",
      aboutTitle: "About this Tool",
      aboutDesc: "This application demonstrates Integration and Analysis using Google Gemini and real-time Futu market data.",
      understood: "Understood"
    }
  },
  zh: {
    title: "股票",
    titleSuffix: "分析师",
    placeholder: "输入代码 (如 HK.00700, AAPL, 1024)...",
    analyze: "分析",
    howItWorks: "工作原理与数据需求",
    readyTitle: "准备分析",
    readyDesc: "输入股票代码，利用 AI 和实时市场数据生成全面的技术分析报告。",
    
    // Loading Steps
    steps: {
      fetch: "正在连接行情数据接口...",
      identify: "正在验证股票身份 (Gemini 搜索)...",
      calc: "正在计算 KDJ, MACD, RSI 及成交量...",
      gen: "AI 技术分析师: 正在撰写深度报告...",
    },

    // Signal Translations
    signals: {
      bullish: "看多",
      bearish: "看空",
      neutral: "中性"
    },

    errorTitle: "分析失败",
    errorDesc: "分析股票失败，请重试。",
    currentPrice: "当前价格",
    trend: "趋势",
    recommendation: "建议",
    techScore: "技术评分",
    scoreRange: "0 (看空) - 5 (看多)",
    keyLevels: "关键点位",
    resistance: "阻力位 (抛压)",
    support: "支撑位 (安全)",
    resistanceDesc: "* 阻力位: 预计有卖出压力。",
    supportDesc: "* 支撑位: 预计有买入兴趣。",
    aiInsight: "技术面深度分析",
    indicators: "指标信号",
    sources: "来源",
    charts: {
      title: "价格与指标",
      price: "价格",
      histogram: "柱状图",
      overbought: "超买",
      oversold: "超卖"
    },
    gauge: {
      strongSell: "强力卖出",
      sell: "卖出",
      neutral: "中性",
      buy: "买入",
      strongBuy: "强力买入",
      label: "看多评分"
    },
    modal: {
      title: "服务数据需求",
      productionReq: "要构建此技术分析服务的生产级版本，您需要以下资源：",
      req1: "实时市场数据 API (如 Bloomberg, Alpha Vantage) 获取 OHLCV 数据。",
      req1Note: "本工具通过本地 Python 桥接连接 Futu OpenD。",
      req2: "计算引擎 (如 TA-Lib, pandas-ta) 用于数学计算指标。",
      req3: "历史数据 (200+ 天) 用于长期均线计算。",
      req4: "AI 层 (Gemini) 用于解读。",
      aboutTitle: "关于本工具",
      aboutDesc: "此应用程序演示了集成和分析功能，使用 Google Gemini 和富途实时行情。",
      understood: "明白了"
    }
  },
  ja: {
    title: "株価",
    titleSuffix: "アナリスト",
    placeholder: "銘柄コード (例: HK.00700, AAPL, 7203)...",
    analyze: "分析",
    howItWorks: "仕組みとデータ要件",
    readyTitle: "分析の準備完了",
    readyDesc: "銘柄コードを入力して、AIとリアルタイム市場データを使用した包括的なテクニカルレポートを生成します。",
    
    // Loading Steps
    steps: {
      fetch: "市場データAPIに接続中...",
      identify: "銘柄情報を確認中 (Gemini Search)...",
      calc: "KDJ, MACD, RSIを計算中...",
      gen: "AIテクニカルアナリスト: レポート作成中...",
    },

    // Signal Translations
    signals: {
      bullish: "強気",
      bearish: "弱気",
      neutral: "中立"
    },

    errorTitle: "分析失敗",
    errorDesc: "株価の分析に失敗しました。もう一度お試しください。",
    currentPrice: "現在価格",
    trend: "トレンド",
    recommendation: "推奨",
    techScore: "テクニカルスコア",
    scoreRange: "0 (弱気) - 5 (強気)",
    keyLevels: "主要レベル",
    resistance: "抵抗線 (売り圧力)",
    support: "支持線 (買い支え)",
    resistanceDesc: "* 抵抗線: 売り圧力が予想されます。",
    supportDesc: "* 支持線: 買い意欲が予想されます。",
    aiInsight: "テクニカル分析の洞察",
    indicators: "指標シグナル",
    sources: "情報源",
    charts: {
      title: "価格と指標",
      price: "価格",
      histogram: "ヒストグラム",
      overbought: "買われすぎ",
      oversold: "売られすぎ"
    },
    gauge: {
      strongSell: "強い売り",
      sell: "売り",
      neutral: "中立",
      buy: "買い",
      strongBuy: "強い買い",
      label: "強気スコア"
    },
    modal: {
      title: "サービスデータ要件",
      productionReq: "このテクニカル分析サービスの製品版を構築するには、以下のリソースが必要です：",
      req1: "OHLCVデータ用のリアルタイム市場データAPI（Bloomberg、Alpha Vantageなど）。",
      req1Note: "このツールは、ローカルのPythonブリッジを介してFutu OpenDに接続します。",
      req2: "指標を数学的に計算するための計算エンジン（TA-Lib、pandas-taなど）。",
      req3: "長期移動平均用の過去データ（200日以上）。",
      req4: "解釈用のAIレイヤー（Gemini）。",
      aboutTitle: "このツールについて",
      aboutDesc: "このアプリケーションは、Google GeminiとFutuリアルタイム市場データを使用した統合と分析機能を示しています。",
      understood: "理解しました"
    }
  }
};