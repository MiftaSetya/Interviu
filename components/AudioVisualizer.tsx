import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  volume: number; // 0 - 255
  isActive: boolean;
  color?: string;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ volume, isActive, color = '#4F46E5' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    
    // Smooth the volume transition
    let currentVolume = 0;

    const render = () => {
      // Approach target volume
      const target = isActive ? volume : 0;
      currentVolume += (target - currentVolume) * 0.1;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Draw concentric circles or a waveform
      // Let's do a pulsing orb effect
      const radiusBase = 30;
      const scale = 1 + (currentVolume / 255) * 1.5; // Scale up to 2.5x
      
      // Outer Glow
      const gradient = ctx.createRadialGradient(centerX, centerY, radiusBase * 0.5, centerX, centerY, radiusBase * scale * 2);
      gradient.addColorStop(0, `${color}80`); // 50% opacity
      gradient.addColorStop(1, 'transparent');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radiusBase * scale * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(centerX, centerY, radiusBase * scale, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      
      // Orbiting particles (simulated)
      if (isActive && currentVolume > 10) {
        const time = Date.now() / 500;
        const particleCount = 5;
        for(let i=0; i<particleCount; i++) {
           const angle = time + (i * (Math.PI * 2 / particleCount));
           const dist = radiusBase * scale * 1.5;
           const px = centerX + Math.cos(angle) * dist;
           const py = centerY + Math.sin(angle) * dist;
           
           ctx.beginPath();
           ctx.arc(px, py, 4, 0, Math.PI * 2);
           ctx.fillStyle = 'white';
           ctx.fill();
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [volume, isActive, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={300} 
      className="w-full h-full max-w-[300px] max-h-[300px]"
    />
  );
};

export default AudioVisualizer;
