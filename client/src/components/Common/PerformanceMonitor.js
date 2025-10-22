import React, { useState, useEffect } from 'react';
import { usePerformance } from '../../hooks/usePerformance';

// Performance monitoring component for development
const PerformanceMonitor = ({ show = false }) => {
  const metrics = usePerformance();
  const [isVisible, setIsVisible] = useState(show);

  // Toggle visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      minWidth: '200px',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        Performance Monitor (Ctrl+Shift+P)
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        Load Time: {metrics.loadTime}ms
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        Memory: {metrics.memoryUsage}MB
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        Network: {metrics.networkSpeed}
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        FPS: <FPSCounter />
      </div>
      
      <div style={{ marginBottom: '4px' }}>
        Connection: {navigator.onLine ? 'Online' : 'Offline'}
      </div>
      
      <button
        onClick={() => setIsVisible(false)}
        style={{
          background: 'transparent',
          border: '1px solid white',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '10px'
        }}
      >
        Close
      </button>
    </div>
  );
};

// FPS counter component
const FPSCounter = () => {
  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [lastTime, setLastTime] = useState(performance.now());

  useEffect(() => {
    let animationId;
    
    const measureFPS = (currentTime) => {
      setFrameCount(prev => prev + 1);
      
      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        setFrameCount(0);
        setLastTime(currentTime);
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [frameCount, lastTime]);

  return <span>{fps}</span>;
};

export default PerformanceMonitor;
