import React, { useState, useEffect } from 'react';
import { motion, useTransform, MotionValue } from 'framer-motion';
import * as Icons from 'lucide-react';
import { ServiceApp, NetworkMode } from '../types';
import { getActiveUrl } from '../utils/network';
import { useLanguage } from '../context/LanguageContext';

interface HelixCardProps {
  app: ServiceApp;
  activeStrength: MotionValue<number>; // 0 to 1 (1 is fully focused)
  networkMode: NetworkMode;
  altMode?: boolean;
}

const HelixCard: React.FC<HelixCardProps> = ({ app, activeStrength, networkMode, altMode }) => {
  const { t } = useLanguage();
  // @ts-ignore
  const IconComponent = Icons[app.icon] || Icons.HelpCircle;
  const currentUrl = getActiveUrl(app, networkMode);
  
  // State for automated checks
  // const [realTimeStatus, setRealTimeStatus] = useState<'online' | 'offline' | 'maintenance'>(app.status || 'offline');
  const realTimeStatus = app.status || 'offline';
  const [currentStats, setCurrentStats] = useState(app.stats || []);
  // const [isChecking, setIsChecking] = useState(false);

  let hostname = '';
  try {
      hostname = new URL(currentUrl).hostname;
  } catch (e) {
      hostname = t('unknown_host');
  }

  // --- AUTOMATED STATUS CHECK (Now handled by App.tsx) ---
  /*
  useEffect(() => {
    // If manually set to maintenance, don't check
    if (app.status === 'maintenance') {
        setRealTimeStatus('maintenance');
        return;
    }

    let isMounted = true;
    const checkStatus = async () => {
        setIsChecking(true);
        try {
            // Use our own backend API to avoid CORS/Mixed Content issues
            // encodeURIComponent is crucial for passing URLs as parameters
            const response = await fetch(`/api/status?url=${encodeURIComponent(currentUrl)}`);
            const data = await response.json();

            if (isMounted) {
                if (data.status === 'online') {
                    setRealTimeStatus('online');
                } else {
                    setRealTimeStatus('offline');
                }
            }
        } catch (error) {
            if (isMounted) setRealTimeStatus('offline');
        } finally {
            if (isMounted) setIsChecking(false);
        }
    };

    checkStatus();
    
    // Poll every 60 seconds
    const interval = setInterval(checkStatus, 60000);
    return () => {
        isMounted = false;
        clearInterval(interval);
    };
  }, [currentUrl, app.status]);
  */


  // --- DYNAMIC STATS FETCHING ---
  // To use this: Add a "statsUrl" property to your service configuration.
  // The endpoint should return JSON: [{ "label": "CPU", "value": "10%" }, ...]
  useEffect(() => {
      if (!app.statsUrl) return;

      const fetchStats = async () => {
          try {
              const res = await fetch(app.statsUrl!);
              if (!res.ok) throw new Error("Stats fetch failed");
              const data = await res.json();
              if (Array.isArray(data)) {
                  setCurrentStats(data);
              }
          } catch (e) {
              console.warn(`Failed to fetch stats for ${app.name}`, e);
          }
      };

      fetchStats();
      const interval = setInterval(fetchStats, 10000); // Update stats every 10s
      return () => clearInterval(interval);
  }, [app.statsUrl]);


  // --- Dynamic Styles based on Active Strength ---
  
  // Opacity of the "Card" container
  const cardOpacity = useTransform(activeStrength, [0.5, 0.8], [0, 1]);
  const cardPointerEvents = useTransform(activeStrength, (v) => v > 0.8 ? 'auto' : 'none');

  // Opacity of the "Dot/Icon" representation (visible when NOT active)
  const dotOpacity = useTransform(activeStrength, [0.4, 0.6], [1, 0]);
  const dotScale = useTransform(activeStrength, [0, 0.5], [1, 0.5]);

  // Color coding based on Status
  const statusColor = realTimeStatus === 'online' ? 'bg-neon-green shadow-[0_0_8px_#0aff00]' 
                    : realTimeStatus === 'maintenance' ? 'bg-yellow-500 shadow-[0_0_8px_orange]'
                    : 'bg-red-500 shadow-[0_0_8px_red]';

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter') return;
    // Matches clicking the button so keyboard users get same behavior
    window.open(currentUrl, '_blank', 'noopener,noreferrer');
  };

  const isGrayedOut = altMode && realTimeStatus === 'offline';
  const dotBorderClass = isGrayedOut ? "border-gray-600" : "border-neon-cyan/50";
  const dotShadowClass = isGrayedOut ? "shadow-none" : "shadow-[0_0_15px_rgba(0,243,255,0.3)]";
  const iconColorClass = isGrayedOut ? "text-gray-600" : "text-neon-cyan";

  return (
    <div className="relative flex items-center justify-center w-[340px] max-w-[90vw] h-[240px]">
      
      {/* 1. The Small Dot / Icon Representation (For distant nodes) */}
      <motion.div 
        className={`absolute flex items-center justify-center w-12 h-12 rounded-full border ${dotBorderClass} bg-black/80 backdrop-blur-sm ${dotShadowClass}`}
        style={{ opacity: dotOpacity, scale: dotScale }}
      >
         <IconComponent size={20} className={iconColorClass} />
      </motion.div>


      {/* 2. The Full Card Representation (For focused node) */}
      <motion.div
        className="absolute inset-0 bg-black/85 backdrop-blur-xl border border-neon-cyan/30 overflow-hidden"
        style={{
          opacity: cardOpacity,
          pointerEvents: cardPointerEvents as any,
          boxShadow: '0 0 30px rgba(0, 243, 255, 0.15)',
          clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)',
        }}
        role="button"
        tabIndex={0}
        onKeyDown={handleCardKeyDown}
      >
         {/* Decorative Grid Inside */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(rgba(0, 243, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.5) 1px, transparent 1px)', backgroundSize: '30px 30px' }} 
        />

        {/* Header */}
        <div className="relative p-5 flex items-center justify-between border-b border-neon-cyan/20 h-[70px]">
            <div className="flex items-center gap-3">
                 <div className="bg-neon-cyan/10 p-2 rounded-sm border border-neon-cyan/20">
                    <IconComponent size={20} className="text-neon-cyan" />
                 </div>
                 <div className="overflow-hidden">
                     <h3 className="font-display font-bold text-xl text-white tracking-wider leading-none truncate max-w-[180px]">{app.name}</h3>
                     <span className="text-[10px] font-mono text-neon-cyan/50 tracking-[0.2em]">{app.category.toUpperCase()}</span>
                 </div>
            </div>
            {/* Status Indicator with Pulse if checking */}
            <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-500 ${statusColor}`} />
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-3 h-[130px] overflow-hidden">
            <p className="text-xs text-gray-400 font-mono leading-relaxed border-l-2 border-gray-800 pl-3 line-clamp-3">
                {app.description}
            </p>
            
            <div className="grid grid-cols-2 gap-2 mt-auto">
                {currentStats.length > 0 ? (
                    currentStats.map((stat, i) => (
                        <div key={i} className="bg-white/5 p-1.5 border border-white/5">
                            <div className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5">{stat.label}</div>
                            <div className="text-sm font-display text-neon-cyan truncate">{stat.value}</div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 text-[9px] text-gray-700 font-mono text-center pt-2">{t('no_telemetry')}</div>
                )}
            </div>
        </div>

        {/* Footer Action */}
        <div className="absolute bottom-0 left-0 w-full h-10 flex z-10">
            <div className="flex-1 h-full bg-neon-cyan/5 px-4 flex items-center border-t border-neon-cyan/20 overflow-hidden">
                <span className="text-[9px] font-mono text-neon-cyan/60 truncate w-full">
                    {networkMode} • {hostname}
                </span>
            </div>
            <a 
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-[110px] h-full bg-neon-cyan text-black font-bold font-display text-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer flex-shrink-0"
            >
                {t('open_sys')}
            </a>
        </div>
      </motion.div>

    </div>
  );
};

export default HelixCard;