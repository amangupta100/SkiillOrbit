// hooks/useFullscreen.js
import { useState } from 'react';

const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Error entering fullscreen:', err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(err => console.error('Error exiting fullscreen:', err));
      }
    }
  };

  return { isFullscreen, toggleFullscreen };
};

export default useFullscreen;