import React, { useState } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { useLanguage } from '../contexts/LanguageContext';
import { GeminiModelType } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { config, setApiUrl, setGeminiBaseUrl, setGeminiModel } = useConfig();
  const { t } = useLanguage();
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  // Check if we are on HTTPS but trying to access HTTP (Mixed Content)
  const isHttps = window.location.protocol === 'https:';
  const isTargetHttp = config.apiUrl.startsWith('http:');
  const showMixedContentWarning = isHttps && isTargetHttp;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
          
          {/* Section 1: Data Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3 border-l-2 border-primary-500 pl-2">
              Data Connection
            </label>
            
            <div className="space-y-4">
              <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Python Bridge URL
                </label>
                <input
                  type="text"
                  value={config.apiUrl}
                  onChange={(e) => setApiUrl(e.target.value.trim())} 
                  placeholder="http://localhost:5000/api/quote"
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-primary-500 transition-colors font-mono"
                />
                <p className="text-[10px] text-gray-500 mt-2">
                   Must point to your running 'bridge.py' service connecting to Futu OpenD.
                </p>
              </div>

              {showMixedContentWarning && (
                <div className="bg-yellow-900/20 border border-yellow-600/30 p-3 rounded-lg flex gap-3 items-start">
                  <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-xs text-yellow-200/80">
                    <strong className="block text-yellow-400 mb-1">Browser Security Warning</strong>
                    Enable "Unsafe Scripts" in your browser address bar to allow HTTP connection to localhost.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: AI Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3 border-l-2 border-green-500 pl-2">
              Gemini AI Connection
            </label>
            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 space-y-4">
               
               {/* Model Selection */}
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      Model Version
                  </label>
                  <select
                      value={config.geminiModel}
                      onChange={(e) => setGeminiModel(e.target.value as GeminiModelType)}
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors"
                  >
                      <option value="gemini-3-flash-preview">Gemini 3.0 Flash (Fastest)</option>
                      <option value="gemini-3-pro-preview">Gemini 3.0 Pro (Detailed)</option>
                  </select>
                  <p className="text-[10px] text-gray-500 mt-2">
                      'Flash' is optimized for speed. 'Pro' provides deeper reasoning but may be slower.
                  </p>
               </div>

               {/* Custom Endpoint */}
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                      Custom Base URL (Optional)
                  </label>
                  <input
                      type="text"
                      value={config.geminiBaseUrl || ''}
                      onChange={(e) => setGeminiBaseUrl(e.target.value.trim())}
                      placeholder="https://generativelanguage.googleapis.com"
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-green-500 transition-colors font-mono"
                  />
               </div>

               {/* API Key Inspector */}
               <div className="border-t border-gray-800 pt-4">
                   <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Current Loaded API Key
                      </label>
                      <button 
                         onClick={() => setShowKey(!showKey)}
                         className="text-[10px] text-primary-400 hover:text-primary-300 transition-colors"
                      >
                         {showKey ? 'Hide' : 'Reveal'}
                      </button>
                   </div>
                   <div className="w-full bg-gray-900 border border-gray-700 text-gray-300 rounded px-3 py-2 text-sm font-mono break-all min-h-[40px] flex items-center">
                      {process.env.API_KEY 
                          ? (showKey ? process.env.API_KEY : `${process.env.API_KEY.substring(0, 8)}••••••••••••••••${process.env.API_KEY.slice(-6)}`)
                          : <span className="text-red-400 italic">Not Found (process.env.API_KEY is undefined)</span>
                      }
                   </div>
                   <p className="text-[10px] text-gray-500 mt-2">
                      This key is injected from your environment variables. 
                      {process.env.API_KEY ? " It is currently loaded successfully." : " Please check your .env file or deployment settings."}
                   </p>
               </div>
            </div>
          </div>

        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};