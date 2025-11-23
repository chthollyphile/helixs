import React, { useState, useEffect } from 'react';
import DNAHelix from './components/DNAHelix';
import Background from './components/Background';
import { detectNetworkMode } from './utils/network';
import { services } from './data';
import { NetworkMode } from './types';

const App: React.FC = () => {
  const [networkMode, setNetworkMode] = useState<NetworkMode>('WAN');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Detect network environment
    setNetworkMode(detectNetworkMode());
    
    // Intro animation timeout
    const timer = setTimeout(() => setIsLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-void min-h-screen text-gray-200 font-sans selection:bg-neon-cyan selection:text-black overflow-hidden relative">
      
      <Background />

      {/* Main Content */}
      <main className={`transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
         <DNAHelix services={services} networkMode={networkMode} />
      </main>

      {/* Intro Overlay / Loader */}
      {!isLoaded && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-6">
             <div className="relative">
                <div className="w-24 h-24 border-t-2 border-b-2 border-neon-cyan rounded-full animate-spin-slow" />
                <div className="absolute inset-0 w-24 h-24 border-l-2 border-r-2 border-neon-pink rounded-full animate-spin reverse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />
             </div>
             
             <div className="text-center">
                 <h2 className="font-display font-bold text-2xl text-white tracking-[0.5em] mb-2">NEUROLINK</h2>
                 <div className="font-mono text-neon-cyan/70 text-xs animate-pulse">
                   INITIALIZING PROTOCOLS...
                 </div>
                 <div className="mt-2 text-[10px] text-gray-600 font-mono">
                   {networkMode} DETECTED
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
