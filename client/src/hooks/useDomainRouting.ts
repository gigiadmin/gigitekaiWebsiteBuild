import { useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';

/**
 * Hook to detect current domain and redirect to appropriate route
 * - gginfo.net → /investor-portal
 * - mainx.gigitekai.com → /mainx (private main site, requires auth)
 * - gigitekai.com → / (home/landing page)
 */
export function useDomainRouting() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    
    // Check if we're on gginfo.net
    const isInvestorDomain = hostname.includes('gginfo.net');
    
    // Check if we're on mainx.gigitekai.com (private main site)
    const isMainxDomain = hostname === 'mainx.gigitekai.com';
    
    // Check if we're on gigitekai.com or main domain
    const isMainDomain = hostname.includes('gigitekai.com') || hostname.includes('ggai.llc') || hostname === 'localhost' || hostname === '127.0.0.1';

    // If on investor domain and not already on investor portal, redirect
    if (isInvestorDomain && !location.startsWith('/investor-portal') && !location.startsWith('/admin')) {
      setLocation('/investor-portal');
    }

    // If on mainx domain and not already on /mainx, redirect
    if (isMainxDomain && !location.startsWith('/mainx')) {
      setLocation('/mainx');
    }

    // If on main domain and on investor portal, redirect to home
    if (isMainDomain && !isMainxDomain && location.startsWith('/investor-portal')) {
      setLocation('/');
    }
  }, [location, setLocation]);
}
