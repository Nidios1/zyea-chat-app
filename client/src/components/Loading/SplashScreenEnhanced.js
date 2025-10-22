import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Enhanced Splash Screen với Framer Motion
 * Modern animations, smooth transitions
 */

const SplashScreenEnhanced = ({ onComplete, isVisible = true, loadingProgress = 0 }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Đang khởi động...');
  const [logoLoaded, setLogoLoaded] = useState(false);

  // Preload logo
  useEffect(() => {
    const img = new Image();
    img.src = '/Zyea.jpg';
    img.onload = () => setLogoLoaded(true);
    img.onerror = () => setLogoLoaded(true);
  }, []);

  // Auto progress animation
  useEffect(() => {
    if (!isVisible || loadingProgress === 0) return;

    const statusMessages = [
      'Đang khởi động...',
      'Đang tải tin nhắn...',
      'Đang tải danh bạ...',
      'Đang tải tường nhà...',
      'Hoàn tất!'
    ];
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const newProgress = (currentStep / 5) * 100;
      setProgress(newProgress);
      setStatus(statusMessages[currentStep - 1] || 'Hoàn tất!');

      if (currentStep >= 5) {
        clearInterval(interval);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 100);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isVisible, onComplete, loadingProgress]);
  
  // Sync with API loading progress
  useEffect(() => {
    if (loadingProgress > 0 && loadingProgress <= 100) {
      if (loadingProgress >= 20 && loadingProgress < 40) {
        setStatus('Đang tải tin nhắn...');
      } else if (loadingProgress >= 40 && loadingProgress < 60) {
        setStatus('Đang tải danh bạ...');
      } else if (loadingProgress >= 60 && loadingProgress < 80) {
        setStatus('Đang tải tường nhà...');
      } else if (loadingProgress >= 80 && loadingProgress < 100) {
        setStatus('Đang tải thông báo...');
      } else if (loadingProgress === 100) {
        setStatus('Hoàn tất!');
      }
    }
  }, [loadingProgress]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #0084ff 0%, #00a651 100%)',
          }}
        >
          {/* Logo Container */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: 0.1
            }}
            className="flex flex-col items-center justify-center"
          >
            {/* Logo Image */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-21 h-21 mb-3"
            >
              <div className="w-full h-full rounded-[20px] overflow-hidden shadow-2xl bg-white/20">
                <motion.img
                  src="/Zyea.jpg"
                  alt="Zyea+"
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: logoLoaded ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>

            {/* App Name */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-5xl md:text-6xl font-bold text-white mb-2"
              style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)' }}
            >
              Zyea+
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 0.9 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-lg text-white/90 font-light mb-8"
            >
              Kết nối mọi người
            </motion.p>

            {/* Loading Dots */}
            <div className="flex gap-2 mb-8">
              {[0, 0.2, 0.4].map((delay, index) => (
                <motion.div
                  key={index}
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay,
                    ease: "easeInOut"
                  }}
                  className="w-3 h-3 bg-white rounded-full opacity-80"
                />
              ))}
            </div>

            {/* Progress Bar (only when loading data) */}
            {loadingProgress > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-[200px] space-y-3"
              >
                {/* Progress Bar */}
                <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full shadow-lg"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>

                {/* Status Text */}
                <motion.p
                  key={status}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-white/80 text-center"
                >
                  {status}
                </motion.p>
              </motion.div>
            )}
          </motion.div>

          {/* Network Pattern (decorative) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-8 right-8 w-30 h-30 md:w-36 md:h-36"
          >
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-full h-full"
            >
              {/* SVG pattern or decorative element */}
              <svg viewBox="0 0 100 100" className="w-full h-full text-white opacity-50">
                <circle cx="20" cy="20" r="3" fill="currentColor" />
                <circle cx="80" cy="20" r="3" fill="currentColor" />
                <circle cx="20" cy="80" r="3" fill="currentColor" />
                <circle cx="80" cy="80" r="3" fill="currentColor" />
                <circle cx="50" cy="50" r="3" fill="currentColor" />
                <line x1="20" y1="20" x2="80" y2="20" stroke="currentColor" strokeWidth="0.5" />
                <line x1="80" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="0.5" />
                <line x1="80" y1="80" x2="20" y2="80" stroke="currentColor" strokeWidth="0.5" />
                <line x1="20" y1="80" x2="20" y2="20" stroke="currentColor" strokeWidth="0.5" />
                <line x1="20" y1="20" x2="50" y2="50" stroke="currentColor" strokeWidth="0.5" />
                <line x1="80" y1="20" x2="50" y2="50" stroke="currentColor" strokeWidth="0.5" />
                <line x1="80" y1="80" x2="50" y2="50" stroke="currentColor" strokeWidth="0.5" />
                <line x1="20" y1="80" x2="50" y2="50" stroke="currentColor" strokeWidth="0.5" />
              </svg>
            </motion.div>
          </motion.div>

          {/* Version Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.6 }}
            className="absolute bottom-5 left-0 right-0 text-center text-xs text-white/50 px-4"
          >
            Zyea+ v1.0.0 © 2025 Zyea+ Corporation.
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreenEnhanced;

