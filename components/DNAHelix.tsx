import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue, MotionValue } from 'framer-motion';
import { Grid } from 'lucide-react';
import { ServiceApp, NetworkMode } from '../types';
import HelixCard from './HelixCard';

interface DNAHelixProps {
  services: ServiceApp[];
  networkMode: NetworkMode;
}

const DNAHelix: React.FC<DNAHelixProps> = ({ services, networkMode }) => {
  // State for Overview Mode (initially true)
  const [isOverview, setIsOverview] = useState(true);
  
  // Motion value for overview transition (1 = Overview, 0 = Focused)
  const overviewProgress = useSpring(isOverview ? 1 : 0, {
    stiffness: 120,
    damping: 20,
    mass: 1
  });

  // Sync spring with state
  useEffect(() => {
    overviewProgress.set(isOverview ? 1 : 0);
  }, [isOverview, overviewProgress]);

  // Current focused index logic
  const activeIndex = useMotionValue(0);
  const smoothIndex = useSpring(activeIndex, {
    stiffness: 150,
    damping: 20,
    mass: 0.8
  });

  // Center index for Overview Mode
  const centerIndex = (services.length - 1) / 2;

  // State to track target for wheel/click events
  const [targetIndex, setTargetIndex] = useState(centerIndex);

  // Sync state with motion value
  useEffect(() => {
    activeIndex.set(targetIndex);
  }, [targetIndex, activeIndex]);

  // Reset to center when entering overview
  useEffect(() => {
    if (isOverview) {
      setTargetIndex(centerIndex);
    }
  }, [isOverview, centerIndex, services.length]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Gestures
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();

        const { deltaX, deltaY } = e;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // --- MODE SWITCHING (Vertical Swipe) ---
        // Threshold prevents accidental switching while scrolling diagonally
        if (absY > absX && absY > 20) {
            if (deltaY < 0 && !isOverview) {
                // Swipe UP -> Go to Overview
                setIsOverview(true);
                return;
            } 
            if (deltaY > 0 && isOverview) {
                // Swipe DOWN -> Go to Focus (Expand)
                setIsOverview(false);
                return;
            }
        }

        // --- NAVIGATION (Horizontal Swipe OR Wheel backup) ---
        // If we are strictly navigating, or if the user is using a mouse wheel (which sends Y) 
        // but hasn't triggered the threshold for mode switching yet.
        
        let moveDelta = 0;

        if (absX > absY) {
            // Clearly horizontal scroll
            moveDelta = deltaX;
        } else if (!isOverview && absY < 20) {
            // In focus mode, allow gentle vertical wheel to scroll sideways (usability fallback)
            moveDelta = deltaY;
        } else if (isOverview && absY < 20) {
             // In overview, gentle vertical wheel also moves sideways
             moveDelta = deltaY;
        }

        if (moveDelta !== 0) {
            const sensitivity = isOverview ? 0.005 : 0.002;
            setTargetIndex(prev => {
                const next = prev + moveDelta * sensitivity;
                return Math.max(-0.5, Math.min(services.length - 0.5, next));
            });
        }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
        container.removeEventListener('wheel', handleWheel);
    };
  }, [isOverview, services.length]);

  const handleNodeClick = (index: number) => {
    setTargetIndex(index);
    setIsOverview(false);
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-10 flex flex-col justify-end pb-0 overflow-hidden bg-transparent"
    >
        {/* HUD Overlay */}
        <HUD 
            currentIndex={smoothIndex} 
            total={services.length} 
            services={services} 
            isOverview={isOverview}
            onToggleOverview={() => setIsOverview(!isOverview)}
        />

        {/* Interaction Zone - Center Line */}
        <div className="relative w-full h-full md:h-[60%] flex items-center justify-center pointer-events-none mb-10 md:mb-0">
            
            {/* Central Axis Line */}
            <motion.div 
                className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" 
                style={{ opacity: useTransform(overviewProgress, [0, 1], [0.5, 0.2]) }}
            />

            {services.map((service, index) => (
                <HelixNode
                    key={service.id}
                    index={index}
                    service={service}
                    globalIndex={smoothIndex}
                    networkMode={networkMode}
                    overviewProgress={overviewProgress}
                    onClick={() => handleNodeClick(index)}
                />
            ))}
        </div>
        
        {/* Helper Text */}
        <motion.div 
            className="absolute bottom-8 left-0 w-full text-center text-[10px] text-neon-cyan/40 font-mono tracking-[0.5em] uppercase pointer-events-none"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
        >
            {isOverview ? "Swipe Down to Expand • Swipe Left/Right to Navigate" : "Swipe Up for Overview • Scroll to Navigate"}
        </motion.div>
    </div>
  );
};

const HelixNode = ({
    index,
    service,
    globalIndex,
    networkMode,
    overviewProgress,
    onClick
}: {
    index: number,
    service: ServiceApp,
    globalIndex: MotionValue<number>,
    networkMode: NetworkMode,
    overviewProgress: MotionValue<number>,
    onClick: () => void
}) => {
    // Distance from the currently looked-at index
    const distanceFromCenter = useTransform(globalIndex, (v) => index - v);

    // --- SPACING LOGIC ---
    const [winWidth, setWinWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1000);

    useEffect(() => {
        const handleResize = () => setWinWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // More compacted spacing in Overview to see the wave
    const overviewSpacing = Math.min(60, winWidth / 20); 
    const focusSpacing = 280;
    
    const currentSpacing = useTransform(overviewProgress, [0, 1], [focusSpacing, overviewSpacing]);

    // X Position
    const x = useTransform([distanceFromCenter, currentSpacing], ([d, s]) => (d as number) * (s as number));

    // --- Y & Z WAVE LOGIC ---
    // Amplitude: High in Focus (100), Moderate in Overview (60) to show the wave shape
    const waveAmplitudeY = useTransform(overviewProgress, [0, 1], [100, 60]); 
    const waveAmplitudeZ = useTransform(overviewProgress, [0, 1], [150, 50]); 

    // Frequency: Tighter waves in overview to see more oscillation
    const frequency = useTransform(overviewProgress, [0, 1], [0.8, 0.5]);

    const y = useTransform([distanceFromCenter, waveAmplitudeY, frequency], ([d, amp, freq]) => {
        return Math.sin((d as number) * (freq as number)) * (amp as number);
    });
    
    const z = useTransform([distanceFromCenter, waveAmplitudeZ, frequency], ([d, amp, freq]) => {
         const zVal = Math.cos((d as number) * (freq as number)) * (amp as number);
         return Number(zVal); 
    });

    // --- SCALE LOGIC ---
    const scale = useTransform([distanceFromCenter, overviewProgress], ([d, o]) => {
        const dist = Math.abs(d as number);
        const ov = o as number; // 0 to 1
        
        // Focus Mode Scale
        const zScale = (Math.cos((d as number) * 0.8) + 1.5) / 2.5; 
        const focusBoost = Math.max(0, 1 - dist * 0.5); 
        const focusedScale = Math.max(0.1, zScale * 0.5 + focusBoost * 0.6);

        // Overview Mode Scale - dots are slightly uniform but pulsate with wave
        const overviewScale = 0.4 + (Math.cos((d as number) * 0.5) * 0.1); 

        // Interpolate
        return focusedScale * (1 - ov) + overviewScale * ov;
    });

    // --- OPACITY LOGIC ---
    const opacity = useTransform([distanceFromCenter, overviewProgress], ([d, o]) => {
        const dist = Math.abs(d as number);
        const ov = o as number;

        const focusOpacity = dist > 6 ? 0 : Math.max(0.2, 1 - dist * 0.15);
        const overviewOpacity = Math.max(0.3, 1 - dist * 0.05); // Fade out very far edges

        return focusOpacity * (1 - ov) + overviewOpacity * ov;
    });

    // --- Z-INDEX LOGIC ---
    const zIndex = useTransform([distanceFromCenter, overviewProgress, z], ([d, o, zPos]) => {
         const ov = o as number;
         // In overview, we just layer by Z position purely
         if (ov > 0.8) {
             return Math.round((zPos as number) + 100);
         }
         
         const centerPriority = 100 - Math.abs(d as number) * 10;
         const zVal = Math.cos((d as number) * 0.8);
         return Math.round(centerPriority + zVal * 10);
    });

    // --- ACTIVE STATE LOGIC ---
    const activeStrength = useTransform([distanceFromCenter, overviewProgress], ([d, o]) => {
        const dist = Math.abs(d as number);
        const rawActive = Math.max(0, 1 - dist);
        return rawActive * (1 - (o as number));
    });

    return (
        <motion.div
            style={{
                position: 'absolute',
                x,
                y,
                scale,
                opacity,
                zIndex,
                cursor: 'pointer'
            }}
            onClick={onClick}
            className="pointer-events-auto flex justify-center items-center"
            whileHover={{ scale: 1.2 }}
        >
             {/* Connector Line - Only visible in Focus Mode */}
            <motion.div 
                className="absolute top-1/2 w-[1px] bg-neon-cyan/30 origin-top"
                style={{ 
                    height: '100px',
                    rotate: useTransform(y, (currentY) => currentY > 0 ? 180 : 0),
                    opacity: useTransform(activeStrength, (s) => 1 - s) 
                }}
            />

            <HelixCard 
                app={service}
                activeStrength={activeStrength}
                networkMode={networkMode}
            />
        </motion.div>
    );
};

interface HUDProps {
    currentIndex: MotionValue<number>;
    total: number;
    services: ServiceApp[];
    isOverview: boolean;
    onToggleOverview: () => void;
}

const HUD: React.FC<HUDProps> = ({ currentIndex, total, services, isOverview, onToggleOverview }) => {
    const [displayIndex, setDisplayIndex] = useState(0);
    
    useEffect(() => {
        const unsub = currentIndex.on("change", (latest) => {
            setDisplayIndex(Math.round(Math.max(0, Math.min(total - 1, latest))));
        });
        return unsub;
    }, [currentIndex, total]);

    const currentService = services[displayIndex];

    return (
        <div className="absolute top-0 left-0 w-full p-6 md:p-12 pointer-events-none flex justify-between items-start z-50">
            {/* Header / Logo */}
            <div className="pointer-events-auto">
                <h1 
                    className="text-4xl md:text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-white tracking-tighter drop-shadow-[0_0_15px_rgba(0,243,255,0.4)] cursor-pointer"
                    onClick={onToggleOverview}
                >
                    NEUROLINK
                </h1>
                <div className="flex items-center gap-4 mt-2">
                     <span className="text-neon-cyan/60 font-mono text-xs tracking-[0.3em] uppercase">Homelab Nav System v2.0</span>
                     <div className="h-[1px] w-12 md:w-20 bg-neon-cyan/30"></div>
                     <button 
                        onClick={onToggleOverview}
                        className={`pointer-events-auto flex items-center gap-2 px-3 py-1 border border-neon-cyan/30 bg-black/50 backdrop-blur-sm text-[10px] font-mono uppercase tracking-wider transition-all hover:bg-neon-cyan/10 hover:border-neon-cyan ${isOverview ? 'text-neon-cyan border-neon-cyan' : 'text-gray-500'}`}
                     >
                        <Grid size={12} />
                        {isOverview ? 'EXPAND VIEW' : 'GRID VIEW'}
                     </button>
                </div>
            </div>

            {/* Detail Info - Fades out in Overview */}
            <motion.div 
                className="text-right hidden md:block"
                animate={{ opacity: isOverview ? 0 : 1, x: isOverview ? 20 : 0 }}
                transition={{ duration: 0.5 }}
            >
                 <div className="text-3xl font-display font-bold text-neon-cyan mb-1">
                    {String(displayIndex + 1).padStart(2, '0')} <span className="text-gray-600 text-lg">/ {String(total).padStart(2, '0')}</span>
                 </div>
                 <div className="font-mono text-xs text-neon-cyan/70 tracking-widest uppercase">
                    {currentService?.category || 'SYSTEM'}
                 </div>
            </motion.div>
        </div>
    );
};

export default DNAHelix;