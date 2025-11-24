import React, { useState, useEffect, useMemo } from 'react';
import DNAHelix from './components/DNAHelix';
import Background from './components/Background';
import { detectNetworkMode, checkServiceStatus, getActiveUrl } from './utils/network';
import { services as defaultServices } from './data';
import { NetworkMode, ServiceApp } from './types';
import { useLanguage } from './context/LanguageContext';

const DEFAULT_SITE_TITLE = 'HELIXS';

const App: React.FC = () => {
  const [networkMode, setNetworkMode] = useState<NetworkMode>('WAN');
  const [isLoaded, setIsLoaded] = useState(false);
  const [servicesData, setServicesData] = useState<ServiceApp[]>([]);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [siteTitle, setSiteTitle] = useState(DEFAULT_SITE_TITLE);
  const [altMode, setAltMode] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, 'online' | 'offline' | 'maintenance'>>({});
  const { t } = useLanguage();

  useEffect(() => {
    // Detect network environment
    setNetworkMode(detectNetworkMode());
    
    // Fetch configuration
    const loadConfig = async () => {
      try {
        const response = await fetch('/config.json');
        if (!response.ok) {
          throw new Error('Failed to load config');
        }
        const data = await response.json();
        if (data.services && Array.isArray(data.services)) {
          setServicesData(data.services);
        } else {
          setServicesData(defaultServices);
        }
      } catch (error) {
        console.warn('Could not load external config, using default embedded data.', error);
        setServicesData(defaultServices);
      } finally {
        setConfigLoaded(true);
      }
    };

    const fetchEnv = async () => {
      try {
          const response = await fetch('/api/env');
          if (response.ok) {
              const data = await response.json();
              setAltMode(!!data.alt_mode);
          }
      } catch (e) {
          console.warn('Failed to fetch env', e);
      }
    };

    loadConfig();
    fetchEnv();
    
    // Intro animation timeout
    const timer = setTimeout(() => setIsLoaded(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Poll service statuses
  useEffect(() => {
    if (!configLoaded || servicesData.length === 0) return;

    const checkAll = async () => {
      const newStatuses: Record<string, 'online' | 'offline' | 'maintenance'> = {};
      
      const promises = servicesData.map(async (service) => {
        // If manually set to maintenance, preserve it
        if (service.status === 'maintenance') {
          newStatuses[service.id] = 'maintenance';
          return;
        }

        const url = getActiveUrl(service, networkMode);
        const status = await checkServiceStatus(url);
        newStatuses[service.id] = status;
      });

      await Promise.all(promises);
      setStatuses(newStatuses);
    };

    checkAll();
    const interval = setInterval(checkAll, 60000);
    return () => clearInterval(interval);
  }, [configLoaded, servicesData, networkMode]);

  const finalServices = useMemo(() => {
    return servicesData.map(s => ({
      ...s,
      status: statuses[s.id] || s.status
    }));
  }, [servicesData, statuses]);

  useEffect(() => {
    const fetchTitle = async () => {
      try {
        const response = await fetch('/api/title');
        if (!response.ok) {
          throw new Error('Failed to fetch title');
        }
        const data = await response.json();
        if (data?.title) {
          setSiteTitle(data.title);
        }
      } catch (error) {
        console.warn('Falling back to default site title.', error);
      }
    };

    fetchTitle();
  }, []);

  useEffect(() => {
    document.title = DEFAULT_SITE_TITLE;
  }, []);

  return (
    <div className="bg-void min-h-screen text-gray-200 font-sans selection:bg-neon-cyan selection:text-black overflow-hidden relative">
      
      <Background />

      {/* Main Content */}
      <main className={`transition-opacity duration-1000 ${isLoaded && configLoaded ? 'opacity-100' : 'opacity-0'}`}>
         {configLoaded && <DNAHelix services={finalServices} networkMode={networkMode} siteTitle={siteTitle} altMode={altMode} />}
      </main>

      {/* Intro Overlay / Loader */}
      {(!isLoaded || !configLoaded) && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-8">
             {/* Animation: Box orbiting a line */}
             <div className="relative w-24 h-24 flex items-center justify-center perspective-1000">
                 {/* Central Static Line */}
                 <div className="w-[1px] h-20 bg-neon-cyan/50 shadow-[0_0_10px_#00f3ff]" />
                 
                 {/* Rotating Container */}
                 <div className="absolute inset-0 flex items-center justify-center animate-spin-medium">
                      {/* Orbiting Square (Offset) */}
                      <div className="w-6 h-6 border border-neon-cyan bg-black/80 shadow-[0_0_15px_rgba(0,243,255,0.4)] translate-x-10 rotate-45 backdrop-blur-sm" />
                      
                      {/* Optional: Second Square for balance/complexity */}
                      <div className="w-4 h-4 border border-neon-pink/50 bg-transparent -translate-x-10 rotate-12" />
                 </div>
             </div>
             
             <div className="text-center z-10">
                 <h2 className="font-display font-bold text-3xl text-white tracking-[0.5em] mb-2">{siteTitle}</h2>
                 <div className="font-mono text-neon-cyan/70 text-xs animate-pulse">
                   {configLoaded ? t('system_init') : t('loading_protocols')}
                 </div>
                 <div className="mt-2 text-[10px] text-gray-600 font-mono">
                   {networkMode} {t('protocol_engaged')}
                 </div>
             </div>
        </div>
      )}
      
      {/* Decorative Vignette & Scanlines */}
      <div className="fixed inset-0 pointer-events-none z-[60] bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.9)_100%)]" />
      
    </div>
  );
};

export default App;