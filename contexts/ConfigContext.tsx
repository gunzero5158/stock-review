import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppConfig, DataSourceType, GeminiModelType } from '../types';

interface ConfigContextType {
  config: AppConfig;
  setDataSource: (source: DataSourceType) => void;
  setApiUrl: (url: string) => void;
  setGeminiBaseUrl: (url: string) => void;
  setGeminiModel: (model: GeminiModelType) => void;
}

const DEFAULT_CONFIG: AppConfig = {
  dataSource: 'CUSTOM_API', // Default strictly to API
  apiUrl: 'http://localhost:5000/api/quote',
  geminiBaseUrl: '',
  geminiModel: 'gemini-3-flash-preview'
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('app_config');
    // Migration: ensure new fields exist if loading from old local storage
    const parsed = saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    // Force CUSTOM_API if it was previously MOCK
    if (parsed.dataSource === 'MOCK') {
        parsed.dataSource = 'CUSTOM_API';
    }
    // Initialize model if missing
    if (!parsed.geminiModel) {
        parsed.geminiModel = 'gemini-3-flash-preview';
    }
    return { ...DEFAULT_CONFIG, ...parsed };
  });

  useEffect(() => {
    localStorage.setItem('app_config', JSON.stringify(config));
  }, [config]);

  const setDataSource = (dataSource: DataSourceType) => {
    setConfig(prev => ({ ...prev, dataSource }));
  };

  const setApiUrl = (apiUrl: string) => {
    setConfig(prev => ({ ...prev, apiUrl }));
  };

  const setGeminiBaseUrl = (geminiBaseUrl: string) => {
    setConfig(prev => ({ ...prev, geminiBaseUrl }));
  };

  const setGeminiModel = (geminiModel: GeminiModelType) => {
    setConfig(prev => ({ ...prev, geminiModel }));
  };

  return (
    <ConfigContext.Provider value={{ config, setDataSource, setApiUrl, setGeminiBaseUrl, setGeminiModel }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error("useConfig must be used within ConfigProvider");
  return context;
};