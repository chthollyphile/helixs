import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { resources, Language, TranslationKey } from '../i18n/locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Basic auto-detection
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'zh') setLanguage('zh');
    else if (browserLang === 'ja') setLanguage('ja');
    else setLanguage('en');
  }, []);

  const t = (key: TranslationKey): string => {
    return resources[language][key] || resources['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};