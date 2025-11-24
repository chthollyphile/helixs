import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { resources, Language, TranslationKey } from '../i18n/locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const supportedLanguages = Object.keys(resources) as Language[];

const normalizeLanguage = (value?: string | null): Language | null => {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return supportedLanguages.includes(normalized as Language) ? (normalized as Language) : null;
};

const detectBrowserLanguage = (): Language => {
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  const browserLang = navigator.language.split('-')[0];
  return normalizeLanguage(browserLang) ?? 'en';
};

const fetchEnvLanguage = async (): Promise<Language | null> => {
  try {
    const response = await fetch('/api/lang', { cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return normalizeLanguage(data?.lang);
  } catch {
    return null;
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    let isMounted = true;

    const initializeLanguage = async () => {
      const envLang = await fetchEnvLanguage();
      if (isMounted) {
        setLanguage(envLang ?? detectBrowserLanguage());
      }
    };

    initializeLanguage();

    return () => {
      isMounted = false;
    };
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