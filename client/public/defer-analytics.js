// Defer 3rd party analytics scripts until after page is interactive
// This prevents render-blocking and improves Core Web Vitals

(function() {
  // Defer loading of analytics scripts until after page is interactive
  if ('requestIdleCallback' in window) {
    // Use requestIdleCallback for non-critical scripts
    requestIdleCallback(loadAnalytics, { timeout: 5000 });
  } else if ('requestAnimationFrame' in window) {
    // Fallback: defer until after paint
    requestAnimationFrame(() => {
      setTimeout(loadAnalytics, 0);
    });
  } else {
    // Last resort: defer with setTimeout
    setTimeout(loadAnalytics, 2000);
  }

  function loadAnalytics() {
    // Google Analytics (gtag) - load asynchronously
    if (window.gtag === undefined) {
      const gtagScript = document.createElement('script');
      gtagScript.async = true;
      gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-00F4D2QCEX';
      gtagScript.onload = () => {
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-00F4D2QCEX', {
          'page_path': window.location.pathname
        });
      };
      document.head.appendChild(gtagScript);
    }

    // Cloudflare Email Decode - load asynchronously
    const cfScript = document.createElement('script');
    cfScript.async = true;
    cfScript.src = 'https://cdn.jsdelivr.net/npm/cloudflare-email-decode@0.1.0/index.min.js';
    document.head.appendChild(cfScript);

    // Umami Analytics - load asynchronously if configured
    if (window.location.hostname === 'gigitekai.com' || window.location.hostname === 'www.gigitekai.com') {
      const umamiScript = document.createElement('script');
      umamiScript.async = true;
      umamiScript.src = 'https://cloud.umami.is/script.js';
      umamiScript.setAttribute('data-website-id', 'your-umami-id');
      document.head.appendChild(umamiScript);
    }
  }
})();
