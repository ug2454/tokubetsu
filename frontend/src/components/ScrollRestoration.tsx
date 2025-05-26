import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Store scroll positions for each route in memory and session storage
const scrollPositions: { [key: string]: number } = {};

// Load saved positions from session storage on startup
const loadSavedPositions = () => {
  try {
    const saved = sessionStorage.getItem('scrollPositions');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(scrollPositions, parsed);
    }
  } catch (error) {
    console.warn('Failed to load scroll positions from session storage:', error);
  }
};

// Save positions to session storage
const saveToSessionStorage = () => {
  try {
    sessionStorage.setItem('scrollPositions', JSON.stringify(scrollPositions));
  } catch (error) {
    console.warn('Failed to save scroll positions to session storage:', error);
  }
};

// Initialize saved positions
loadSavedPositions();

const ScrollRestoration: React.FC = () => {
  const location = useLocation();
  const isInitialLoad = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastPath = useRef<string>(location.pathname);

  useEffect(() => {
    // Save current scroll position before route change
    const saveScrollPosition = (path?: string) => {
      const currentPath = path || window.location.pathname;
      const scrollY = window.scrollY;
      if (scrollY > 0) {
        scrollPositions[currentPath] = scrollY;
        console.log(`Saving scroll position for ${currentPath}: ${scrollY}`);
        saveToSessionStorage();
      }
    };

    // Restore scroll position after route change
    const restoreScrollPosition = () => {
      const currentPath = location.pathname;
      const savedPosition = scrollPositions[currentPath];
      
      // Save the previous path's scroll position
      if (lastPath.current !== currentPath) {
        saveScrollPosition(lastPath.current);
        lastPath.current = currentPath;
      }
      
      if (savedPosition !== undefined && savedPosition > 0) {
        // For dashboard and other dynamic content routes, use progressive restoration
        const attemptRestore = (attempt: number = 0) => {
          const maxAttempts = 5;
          const delay = currentPath === '/' ? 500 + (attempt * 200) : 300 + (attempt * 100);
          
          setTimeout(() => {
            // Double-check that the document height allows this scroll position
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            const targetScroll = Math.min(savedPosition, maxScroll);
            
            // Only restore if the content has loaded (document height is sufficient)
            if (maxScroll >= savedPosition * 0.8 || attempt >= maxAttempts - 1) {
              console.log(`Restoring scroll position for ${currentPath}: ${targetScroll} (attempt ${attempt + 1})`);
              window.scrollTo({
                top: targetScroll,
                behavior: 'auto'
              });
            } else if (attempt < maxAttempts - 1) {
              // Content might still be loading, try again
              console.log(`Content still loading for ${currentPath}, retrying scroll restoration...`);
              attemptRestore(attempt + 1);
            }
          }, delay);
        };
        
        attemptRestore();
      } else if (!savedPosition || isInitialLoad.current) {
        // For new routes or initial load, scroll to top
        window.scrollTo(0, 0);
      }
      
      isInitialLoad.current = false;
    };

    // Save scroll position before unload
    const handleBeforeUnload = () => saveScrollPosition();
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Restore scroll position after navigation
    restoreScrollPosition();

    // Also try to restore after a short delay and when DOM content is loaded
    const fallbackRestore = () => {
      const currentPath = location.pathname;
      const savedPosition = scrollPositions[currentPath];
      if (savedPosition !== undefined && savedPosition > 0 && window.scrollY === 0) {
        console.log(`Fallback scroll restoration for ${currentPath}: ${savedPosition}`);
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const targetScroll = Math.min(savedPosition, maxScroll);
        window.scrollTo({
          top: targetScroll,
          behavior: 'auto'
        });
      }
    };

    // Additional restoration attempts
    setTimeout(fallbackRestore, 100);
    setTimeout(fallbackRestore, 1000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname]);

  // Save scroll position on scroll events (throttled)
  useEffect(() => {
    const handleScroll = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        const currentPath = location.pathname;
        const scrollY = window.scrollY;
        if (scrollY > 0) {
          scrollPositions[currentPath] = scrollY;
          saveToSessionStorage();
          console.log(`Updated scroll position for ${currentPath}: ${scrollY}`);
        }
      }, 300); // Increase throttle time for better performance
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  return null; // This component doesn't render anything
};

export default ScrollRestoration; 