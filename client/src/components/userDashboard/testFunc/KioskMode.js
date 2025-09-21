// components/KioskMode.js
import { useEffect } from 'react';

const KioskMode = ({ autoFullscreen = true, allowExit = false }) => {
  useEffect(() => {
    if (autoFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Fullscreen error:', err);
      });
    }

    const handleKeyDown = (e) => {
      // Block ESC key if not allowed to exit
      if (e.key === 'Escape' && !allowExit) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Block F11 (common fullscreen toggle)
      if (e.key === 'F11') {
        e.preventDefault();
      }
    };

    const handleFullscreenChange = () => {
      if (!allowExit && !document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [autoFullscreen, allowExit]);

  return null;
};

export default KioskMode;