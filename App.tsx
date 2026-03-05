import React, { useState } from 'react';
import { analyzeStock, identifyStockName } from './services/geminiService';
import { fetchStockData } from './services/stockService'; 
import { AppState, StockDataPoint, Language, LoadingStep } from './types';
import { GaugeChart } from './components/GaugeChart';
import { TechnicalCharts } from './components/Charts';
import { InfoModal } from './components/InfoModal';
import { SettingsModal } from './components/SettingsModal';
import { useLanguage } from './contexts/LanguageContext';
import { useConfig } from './contexts/ConfigContext';

// Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const TrendIcon = ({ trend }: { trend: 'UP' | 'DOWN' | 'SIDEWAYS' }) => {
  // Red for UP (Bullish), Green for DOWN (Bearish)
  if (trend === 'UP') return <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
  if (trend === 'DOWN') return <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>;
  return <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>;
};

// Checkmark icon for completed steps
const CheckIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

export default function App() {
  const [searchInput, setSearchInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { language, setLanguage, t } = useLanguage();
  const { config } = useConfig();
  
  const [state, setState] = useState<AppState>({
    loadingStep: 'IDLE',
    error: null,
    data: null,
    chartData: [],
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    // Reset State
    setState(prev => ({ ...prev, loadingStep: 'FETCH_DATA', error: null, data: null }));

    try {
      // Step 1: Fetch Data
      const result = await fetchStockData(searchInput, config);
      
      // Step 2: Verify Stock Name (If missing from API)
      let verifiedName = result.name;
      if (!verifiedName && result.source === 'REAL') {
         setState(prev => ({ ...prev, loadingStep: 'IDENTIFY_STOCK', chartData: result.data }));
         try {
             verifiedName = await identifyStockName(result.symbol, config);
         } catch (e) {
             console.warn("Failed to verify stock name via Gemini:", e);
             // Fallback to symbol if verification fails
             verifiedName = result.symbol;
         }
      }

      // Step 3: Simulate Calculation (fast)
      setState(prev => ({ ...prev, loadingStep: 'CALCULATE_INDICATORS', chartData: result.data }));
      await new Promise(r => setTimeout(r, 600)); // Visual delay for user to see the step

      // Step 4: AI Analysis
      setState(prev => ({ ...prev, loadingStep: 'GENERATING_REPORT' }));

      const analysisResult = await analyzeStock(
        result.symbol, 
        verifiedName, // Use the verified name (API or Gemini)
        language, 
        result.data, 
        config, 
        result.source === 'MOCK'
      );
      
      setState({
        loadingStep: 'IDLE',
        error: null,
        data: analysisResult,
        chartData: result.data
      });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loadingStep: 'IDLE',
        error: err.message || t('errorDesc')
      }));
    }
  };

  const isLoading = state.loadingStep !== 'IDLE';

  // Helper to render loading steps
  const renderLoadingStep = (stepKey: string, currentStep: LoadingStep, targetStep: LoadingStep, isCompleted: boolean) => {
     let isActive = currentStep === targetStep;
     
     let statusClass = "text-gray-500 border-gray-700";
     
     // Mapping steps to numbers
     const stepMap: Record<string, string> = {
       'fetch': '1',
       'identify': '2',
       'calc': '3',
       'gen': '4'
     };

     let stepNum = stepMap[stepKey] || '0';
     let icon = <span className="text-xs">{stepNum}</span>;

     if (isCompleted) {
        statusClass = "bg-primary-500 border-primary-500 text-white";
        icon = <CheckIcon />;
     } else if (isActive) {
        statusClass = "border-primary-500 text-primary-400 animate-pulse";
        icon = <div className="w-2 h-2 bg-primary-400 rounded-full animate-ping" />;
     }

     return (
        <div className="flex items-center gap-3 transition-all duration-300">
           <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono ${statusClass}`}>
              {icon}
           </div>
           <span className={`${isActive || isCompleted ? 'text-gray-200' : 'text-gray-600'} text-sm font-medium`}>
              {t(`steps.${stepKey}`)}
           </span>
        </div>
     );
  };

  // Logic to determine completion state for the list
  const steps = ['FETCH_DATA', 'IDENTIFY_STOCK', 'CALCULATE_INDICATORS', 'GENERATING_REPORT', 'IDLE'];
  const getCurrentStepIndex = (s: LoadingStep) => steps.indexOf(s);
  const isStepDone = (target: string) => getCurrentStepIndex(state.loadingStep) > steps.indexOf(target);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-primary-500 selection:text-white pb-20">
      <InfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center font-bold text-white shadow-lg shadow-primary-500/20">
               AI
             </div>
             <h1 className="text-xl font-bold tracking-tight text-white">{t('title')}<span className="text-primary-400">{t('titleSuffix')}</span></h1>
             {config.dataSource === 'CUSTOM_API' && (
                <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-primary-900/50 text-primary-400 border border-primary-800 font-mono">
                  API MODE
                </span>
             )}
          </div>
          
          <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
            <input 
              type="text" 
              placeholder={t('placeholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={isLoading}
              className="w-full bg-gray-950 border border-gray-700 text-gray-200 text-sm rounded-full pl-10 pr-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all placeholder-gray-600 disabled:opacity-50"
            />
            <div className="absolute left-3.5 top-3 text-gray-500 group-focus-within:text-primary-400 transition-colors">
              <SearchIcon />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="absolute right-1.5 top-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-xs font-medium transition-colors border border-gray-700 disabled:opacity-50"
            >
              {t('analyze')}
            </button>
          </form>

          <div className="flex items-center gap-4">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-gray-800 text-gray-300 text-xs rounded border border-gray-700 px-2 py-1 outline-none focus:border-primary-500"
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
            </select>
            
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Settings"
            >
                <SettingsIcon />
            </button>

            <button 
              onClick={() => setIsModalOpen(true)} 
              className="text-xs text-gray-500 hover:text-primary-400 underline decoration-dotted transition-colors hidden sm:block"
            >
              {t('howItWorks')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Empty State */}
        {!state.data && !isLoading && !state.error && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-6 border border-gray-800">
              <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-300 mb-2">{t('readyTitle')}</h2>
            <p className="max-w-md text-gray-500">
              {t('readyDesc')}
            </p>
          </div>
        )}

        {/* Detailed Progress Loader */}
        {isLoading && (
          <div className="max-w-md mx-auto py-20">
             <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 shadow-2xl">
                <div className="flex items-center justify-center mb-8">
                  <div className="relative w-16 h-16">
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-800 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                  </div>
                </div>
                <h3 className="text-center text-xl font-bold text-white mb-6">AI Analyst Working...</h3>
                <div className="space-y-4">
                   {renderLoadingStep('fetch', state.loadingStep, 'FETCH_DATA', isStepDone('FETCH_DATA'))}
                   {renderLoadingStep('identify', state.loadingStep, 'IDENTIFY_STOCK', isStepDone('IDENTIFY_STOCK'))}
                   {renderLoadingStep('calc', state.loadingStep, 'CALCULATE_INDICATORS', isStepDone('CALCULATE_INDICATORS'))}
                   {renderLoadingStep('gen', state.loadingStep, 'GENERATING_REPORT', false)}
                </div>
             </div>
          </div>
        )}

        {/* Error State */}
        {state.error && (
          <div className="max-w-xl mx-auto bg-red-900/10 border border-red-500/20 p-6 rounded-xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-900/30 text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-red-200 mb-2">{t('errorTitle')}</h3>
            <p className="text-red-300/80">{state.error}</p>
          </div>
        )}

        {/* Results Dashboard */}
        {state.data && !isLoading && (
          <div className="animate-fade-in space-y-6">
            
            {/* Top Bar: Title & Price */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-800 pb-4 gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">{state.data.symbol}</h2>
                <div className="flex items-center gap-2 text-gray-400 mt-1 text-sm">
                  <span>{t('currentPrice')}:</span>
                  <span className="text-xl font-mono text-white font-semibold">{state.data.price || "N/A"}</span>
                </div>
              </div>
              <div className="flex gap-3">
                 <div className="bg-gray-900 px-4 py-2 rounded-lg border border-gray-800">
                    <span className="block text-xs text-gray-500 uppercase">{t('trend')}</span>
                    <div className="flex items-center gap-1 font-bold text-gray-200">
                      <TrendIcon trend={state.data.trend as any} />
                      {state.data.trend}
                    </div>
                 </div>
                 <div className="bg-gray-900 px-4 py-2 rounded-lg border border-gray-800">
                    <span className="block text-xs text-gray-500 uppercase">{t('recommendation')}</span>
                    {/* Recommendation Red for Buy, Green for Sell */}
                    <span className={`font-bold ${state.data.score >= 3 ? 'text-red-400' : 'text-green-400'}`}>
                      {state.data.recommendation}
                    </span>
                 </div>
              </div>
            </div>

            {/* SECTION 1: Detailed AI Analysis (Now at Top) */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-xl shadow-black/20">
               <div className="flex items-center gap-2 mb-4">
                 <div className="w-2 h-6 bg-primary-500 rounded-full"></div>
                 <h3 className="text-lg font-bold text-white">{t('aiInsight')}</h3>
               </div>
               <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                  <p className="leading-relaxed whitespace-pre-wrap">{state.data.detailedAnalysis}</p>
               </div>
            </div>

            {/* SECTION 2: Grid for Charts & Indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Charts & Score Summary */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Score Summary (Kept near charts) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex flex-col justify-between">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{t('techScore')}</h3>
                        <GaugeChart score={state.data.score} />
                        <p className="text-center text-sm text-gray-500 mt-2">
                           {t('scoreRange')}
                        </p>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
                         <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{t('keyLevels')}</h3>
                         <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-950 rounded border border-gray-800">
                               <span className="text-green-400 font-medium text-sm">{t('resistance')}</span>
                               <span className="font-mono text-white">{state.data.resistance}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-950 rounded border border-gray-800">
                               <span className="text-red-400 font-medium text-sm">{t('support')}</span>
                               <span className="font-mono text-white">{state.data.support}</span>
                            </div>
                         </div>
                         <div className="text-xs text-gray-500 mt-4 leading-relaxed">
                           {t('resistanceDesc')}<br/>
                           {t('supportDesc')}
                         </div>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="h-96">
                   <TechnicalCharts data={state.chartData} />
                </div>

              </div>

              {/* Right Column: Indicators */}
              <div className="space-y-6">
                
                {/* Indicator Breakdown */}
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 h-full">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t('indicators')}</h3>
                  <div className="space-y-3">
                    {state.data.indicators.map((ind, idx) => (
                      <div key={idx} className="group p-3 hover:bg-gray-800 rounded-lg transition-colors border border-gray-800/50 hover:border-gray-700">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-gray-200">{ind.name}</span>
                          {/* Bullish (Buy) = Red, Bearish (Sell) = Green */}
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                            ind.signal === 'BULLISH' ? 'bg-red-900/40 text-red-400 border border-red-800' :
                            ind.signal === 'BEARISH' ? 'bg-green-900/40 text-green-400 border border-green-800' :
                            'bg-gray-800 text-gray-400 border border-gray-700'
                          }`}>
                            {t(`signals.${(ind.signal || 'NEUTRAL').toLowerCase()}`)}
                          </span>
                        </div>
                        {ind.value && (
                           <div className="text-xs font-mono text-primary-400 mb-1 line-clamp-2 break-all overflow-hidden" title={ind.value}>
                             {ind.value}
                           </div>
                        )}
                        <p className="text-xs text-gray-500 line-clamp-3">{ind.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sources - optional */}
                {state.data.sources && state.data.sources.length > 0 && (
                   <div className="text-xs text-gray-600 px-4">
                      <p className="uppercase font-bold mb-2">{t('sources')}</p>
                      <ul className="space-y-1">
                        {state.data.sources.slice(0, 3).map((source, i) => (
                           <li key={i} className="truncate">
                             <a href={source.uri} target="_blank" rel="noreferrer" className="hover:text-primary-400 transition-colors">
                               {source.title}
                             </a>
                           </li>
                        ))}
                      </ul>
                   </div>
                )}
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}