import React, { useEffect, useRef } from 'react';

const Background: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number }[] = [];
    
    // Create grid points
    const spacing = 100;
    for (let x = 0; x < width; x += spacing) {
      for (let y = 0; y < height; y += spacing) {
        if (Math.random() > 0.7) {
          particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            size: Math.random() * 2
          });
        }
      }
    }

    const draw = () => {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      // Draw Grid
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      
      // Vertical lines
      for (let x = 0; x <= width; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 0; y <= height; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Particles/Nodes
      ctx.fillStyle = '#00f3ff';
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.globalAlpha = Math.random() * 0.5 + 0.2;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        
        // Random connection lines
        if (Math.random() > 0.98) {
           ctx.beginPath();
           ctx.strokeStyle = '#00f3ff';
           ctx.lineWidth = 0.5;
           ctx.moveTo(p.x, p.y);
           ctx.lineTo(p.x + (Math.random() - 0.5) * 50, p.y + (Math.random() - 0.5) * 50);
           ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;

      requestAnimationFrame(draw);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    const frameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
    />
  );
};

export default Background;