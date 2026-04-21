(function () {
  const DEFAULT_LOCAL_BASE_URL = 'http://localhost:5000';
  const DEFAULT_PROD_BASE_URL = 'https://cleanupconnect.onrender.com';

  const storedBaseUrl = localStorage.getItem('cleanupconnect_api_base_url');
  const baseUrl = (storedBaseUrl || (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
      ? DEFAULT_LOCAL_BASE_URL
      : DEFAULT_PROD_BASE_URL
  )).replace(/\/$/, '');

  window.CLEANUPCONNECT_API_BASE_URL = baseUrl;

  window.CleanupConnectAPI = {
    baseUrl,
    url(path) {
      return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    },
  };

  const originalFetch = window.fetch.bind(window);

  function rewriteUrl(input) {
    if (typeof input !== 'string') {
      return input;
    }

    const localhostPrefixes = [
      'http://localhost:5000',
      'https://localhost:5000',
      'http://127.0.0.1:5000',
      'https://127.0.0.1:5000',
    ];

    const match = localhostPrefixes.find((prefix) => input.startsWith(prefix));
    if (!match) {
      return input;
    }

    return `${baseUrl}${input.slice(match.length)}`;
  }

  window.fetch = function (input, init) {
    if (typeof input === 'string') {
      return originalFetch(rewriteUrl(input), init);
    }

    if (input instanceof Request) {
      const rewritten = rewriteUrl(input.url);
      if (rewritten !== input.url) {
        return originalFetch(new Request(rewritten, input), init);
      }
    }

    return originalFetch(input, init);
  };
})();