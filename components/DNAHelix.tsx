import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue, MotionValue } from 'framer-motion';
import { Grid, Search, ArrowRight, ArrowLeft } from 'lucide-react';
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

  // Keep a ref of targetIndex to access in event listeners without re-binding
  const targetIndexRef = useRef(targetIndex);
  useEffect(() => {
    targetIndexRef.current = targetIndex;
    activeIndex.set(targetIndex);
  }, [targetIndex, activeIndex]);

  // Reset to center when entering overview
  useEffect(() => {
    if (isOverview) {
      setTargetIndex(centerIndex);
    }
  }, [isOverview, centerIndex, services.length]);

  const containerRef = useRef<HTMLDivElement>(null);
  
  // Touch Handling Refs
  const touchStartRef = useRef<{x: number, y: number} | null>(null);
  const startDragIndexRef = useRef(0);
  const axisLockRef = useRef<'x' | 'y' | null>(null);

  // --- SEARCH FUNCTIONALITY ---
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Keydown Listener to start search AND handle navigation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
        // Ignore if search is already active
        if (isSearching) return;

        // --- NAVIGATION ---
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setTargetIndex(prev => Math.max(0, Math.ceil(prev) - 1));
            return;
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            setTargetIndex(prev => Math.min(services.length - 1, Math.floor(prev) + 1));
            return;
        }

        // --- SEARCH TRIGGER ---
        // Ignore if modifiers are pressed
        if (e.ctrlKey || e.altKey || e.metaKey || e.key.length !== 1) return;
        
        // Only trigger on alphanumeric-ish keys
        if (!/^[a-zA-Z0-9]$/.test(e.key)) return;

        e.preventDefault();
        setIsSearching(true);
        setSearchQuery(e.key);
        // Focus will happen via useEffect dependent on isSearching
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSearching, services.length]);

  // Auto-focus input when search starts
  useEffect(() => {
    if (isSearching && searchInputRef.current) {
        searchInputRef.current.focus();
    }
  }, [isSearching]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        // Fuzzy Search Logic
        const matchIndex = services.findIndex(s => 
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.category.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (matchIndex !== -1) {
            setTargetIndex(matchIndex);
            setIsOverview(false);
            // Close search
            setIsSearching(false);
            setSearchQuery('');
        }
    } else if (e.key === 'Escape') {
        setIsSearching(false);
        setSearchQuery('');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearchQuery(val);
      if (val.length === 0) {
          setIsSearching(false);
      }
  };


  // --- GESTURE HANDLING (WHEEL & TOUCH) ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- MOUSE WHEEL ---
    const handleWheel = (e: WheelEvent) => {
        // Prevent gestures if searching
        if (isSearching) return;

        e.preventDefault();

        const { deltaX, deltaY } = e;
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // --- MODE SWITCHING (Vertical Swipe) ---
        // Threshold prevents accidental switching while scrolling diagonally
        if (absY > absX && absY > 20) {
            if (deltaY < 0 && !isOverview) {
                // Swipe UP (Scroll Up) -> Go to Overview
                setIsOverview(true);
                return;
            } 
            if (deltaY > 0 && isOverview) {
                // Swipe DOWN (Scroll Down) -> Go to Focus (Expand)
                setIsOverview(false);
                return;
            }
        }

        // --- NAVIGATION ---
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

    // --- TOUCH EVENTS ---
    const handleTouchStart = (e: TouchEvent) => {
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
        startDragIndexRef.current = targetIndexRef.current;
        axisLockRef.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
        // Prevent default scrolling behavior to allow custom gestures
        if(!isSearching && e.cancelable) {
            e.preventDefault();
        }
        
        if (!touchStartRef.current) return;

        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - touchStartRef.current.x;
        const deltaY = currentY - touchStartRef.current.y;

        // Determine axis intention
        if (!axisLockRef.current) {
            if (Math.abs(deltaX) > 10) axisLockRef.current = 'x';
            else if (Math.abs(deltaY) > 10) axisLockRef.current = 'y';
        }

        if (axisLockRef.current === 'x') {
            // Natural scrolling: Drag Left -> Move Right (Next Items) -> Index Increases
            // Sensitivity Logic:
            // Focus Mode: Spacing is ~360px. Moving 300px should roughly equal 1 index.
            // Overview Mode: Items are denser. 
            const pxPerIndex = isOverview ? 100 : 300; 
            
            const indexChange = deltaX / pxPerIndex;
            // Subtract delta because dragging LEFT (negative) should add to index
            const newIndex = startDragIndexRef.current - indexChange;
            
            setTargetIndex(Math.max(-0.5, Math.min(services.length - 0.5, newIndex)));
        }
    };

    const handleTouchEnd = (e: TouchEvent) => {
        if (!touchStartRef.current || isSearching) return;
        
        // If Y-axis lock, check for swipe triggers
        if (axisLockRef.current === 'y') {
             const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
             if (Math.abs(deltaY) > 50) {
                if (deltaY < 0 && !isOverview) setIsOverview(true);
                else if (deltaY > 0 && isOverview) setIsOverview(false);
             }
        } else {
            // Horizontal or Tap -> Snap to nearest index
            setTargetIndex(prev => Math.round(prev));
        }
        
        touchStartRef.current = null;
        axisLockRef.current = null;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    
    // Touch listeners
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOverview, services.length, isSearching]);

  const handleNodeClick = (index: number) => {
    setTargetIndex(index);
    setIsOverview(false);
  };

  // Preview match for search UI
  const previewMatch = services.find(s => 
    searchQuery && (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

        {/* --- SEARCH UI OVERLAY --- */}
        {isSearching && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                <div className="w-full max-w-xl px-4 flex flex-col items-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full relative"
                    >
                        <div className="text-neon-cyan font-mono text-[10px] tracking-[0.4em] uppercase mb-2 text-center">
                            System Query Protocol
                        </div>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onKeyDown={handleSearchKeyDown}
                            className="w-full bg-transparent text-center font-display font-bold text-5xl md:text-7xl text-white uppercase outline-none placeholder-neon-cyan/20 caret-neon-pink"
                            spellCheck={false}
                        />
                        <div className="w-full h-[2px] bg-neon-cyan shadow-[0_0_15px_#00f3ff] mt-2 relative overflow-hidden">
                             <div className="absolute inset-0 bg-white/50 animate-pulse-fast w-full h-full" />
                        </div>
                        
                        {/* Fuzzy Match Preview */}
                        <div className="mt-4 h-8 flex items-center justify-center text-neon-cyan/80 font-mono tracking-widest text-sm">
                            {previewMatch ? (
                                <>
                                    <span className="opacity-50 mr-2">{'>'} DETECTED:</span>
                                    <span className="font-bold border border-neon-cyan/30 px-2 py-0.5 bg-neon-cyan/10">
                                        {previewMatch.name}
                                    </span>
                                </>
                            ) : (
                                <span className="text-red-500 opacity-70">{'>'} NO_MATCHING_SIGNATURE</span>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        )}

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
            className="absolute bottom-8 left-0 w-full text-center text-[10px] text-neon-cyan/40 font-mono tracking-[0.5em] uppercase pointer-events-auto cursor-pointer select-none z-50"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
            onClick={() => setIsSearching(true)}
        >
            {isSearching 
                ? "PRESS ENTER TO JUMP • ESC TO CANCEL"
                : (isOverview ? "Swipe Down to Expand • Drag to Navigate • Tap to Search" : "Swipe Up for Overview • Drag to Navigate • Tap to Search")
            }
        </motion.div>
    </div>
  );
};

interface HelixNodeProps {
    index: number;
    service: ServiceApp;
    globalIndex: MotionValue<number>;
    networkMode: NetworkMode;
    overviewProgress: MotionValue<number>;
    onClick: () => void;
}

const HelixNode: React.FC<HelixNodeProps> = ({
    index,
    service,
    globalIndex,
    networkMode,
    overviewProgress,
    onClick
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
    // Increased Focus Spacing for larger cards (340px width + padding)
    const focusSpacing = 360;
    
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

    // --- LABEL VISIBILITY LOGIC ---
    // Visible only when:
    // 1. Not in Overview Mode (overviewProgress ~ 0)
    // 2. Not the active center card (activeStrength < 0.8)
    const labelOpacity = useTransform([activeStrength, overviewProgress], ([strength, overview]) => {
        const s = strength as number;
        const o = overview as number;
        
        // Hide in overview
        if (o > 0.5) return 0;
        
        // Hide on center card (it has its own title inside the card)
        if (s > 0.8) return 0;
        
        // Fade in for side nodes
        return 1;
    });

    return (
        <motion.div
            style={{
                position: 'absolute',
                x,
                y,
                zIndex,
                cursor: 'pointer'
            }}
            onClick={onClick}
            className="pointer-events-auto flex justify-center items-center relative"
        >
            {/* 
              NESTED SCALING STRUCTURE:
              Outer (above): Handles Position (x, y, z).
              Middle (here): Handles calculated Scale & Opacity from helix math.
              Inner (child): Handles relative Hover Scale.
              
              This separates the "base" scale from the "interaction" scale to avoid conflicts 
              where Framer Motion overwrites the dynamic scale with a static one on hover exit.
            */}
            <motion.div
                style={{ scale, opacity }}
                className="flex justify-center items-center relative"
            >
                {/* Interaction Wrapper */}
                <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    <HelixCard 
                        app={service}
                        activeStrength={activeStrength}
                        networkMode={networkMode}
                    />
                </motion.div>

                 {/* Connector Line - Only visible in Focus Mode */}
                <motion.div 
                    className="absolute top-1/2 w-[1px] bg-neon-cyan/30 origin-top pointer-events-none"
                    style={{ 
                        height: '100px',
                        rotate: useTransform(y, (currentY) => currentY > 0 ? 180 : 0),
                        opacity: useTransform(activeStrength, (s) => 1 - s) 
                    }}
                />

                {/* Permanent Label (Only active in Focus Mode when NOT the main card) */}
                <motion.div
                    style={{ opacity: labelOpacity }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                >
                     <span className="text-[10px] font-mono text-neon-cyan/80 bg-black/60 px-2 py-0.5 rounded border border-neon-cyan/20 whitespace-nowrap backdrop-blur-sm shadow-[0_0_10px_rgba(0,243,255,0.2)]">
                        {service.name}
                     </span>
                     {/* Connecting line to dot */}
                     <div className="w-[1px] h-4 bg-gradient-to-b from-neon-cyan/50 to-transparent"></div>
                </motion.div>
            </motion.div>
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
                    HELIXS
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