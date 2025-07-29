import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useAnalytics = () => {
  const location = useLocation();
  const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;

  // Track page views on route change
  useEffect(() => {
    if (measurementId && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname,
      });
    }
  }, [location, measurementId]);

  // Function to track custom events
  const trackEvent = (eventName, params = {}) => {
    if (measurementId && window.gtag) {
      window.gtag('event', eventName, params);
    }
  };

  return { trackEvent };
};

export default useAnalytics;