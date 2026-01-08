import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full p-6 text-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{t('modal.title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 text-sm md:text-base leading-relaxed overflow-y-auto max-h-[60vh] pr-2">
          <p className="font-semibold text-primary-400">
            {t('modal.productionReq')}
          </p>

          <ul className="list-disc pl-5 space-y-2 text-gray-300">
            <li>
              <strong className="text-white">API: </strong>
              {t('modal.req1')}
              <br/>
              <span className="text-gray-500 italic">{t('modal.req1Note')}</span>
            </li>
            
            <li>
              <strong className="text-white">Engine: </strong>
              {t('modal.req2')}
            </li>

            <li>
              <strong className="text-white">Data: </strong>
              {t('modal.req3')}
            </li>

            <li>
              <strong className="text-white">AI: </strong>
              {t('modal.req4')}
            </li>
          </ul>

          <div className="bg-gray-800/50 p-4 rounded-lg mt-4 border border-gray-700">
            <h3 className="font-bold text-white mb-2">{t('modal.aboutTitle')}</h3>
            <p>
              {t('modal.aboutDesc')}
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg transition-colors"
          >
            {t('modal.understood')}
          </button>
        </div>
      </div>
    </div>
  );
};
