(function () {
  const TOKEN_KEY = 'community_cleaning_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  function isLoggedIn() {
    return Boolean(getToken());
  }

  async function fetchProfile() {
    const token = getToken();

    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(window.CleanupConnectAPI.url('/me'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearToken();
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to load profile');
    }

    const data = await response.json();
    return data.user;
  }

  window.Auth = {
    TOKEN_KEY,
    getToken,
    setToken,
    clearToken,
    isLoggedIn,
    fetchProfile,
  };
})();
