(function () {
  async function renderNavbar() {
    const nav = document.getElementById('navbar');
    if (!nav) {
      return;
    }

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    let loggedIn = window.Auth && window.Auth.isLoggedIn();
    const links = [
      { href: 'index.html', label: 'Home' },
      { href: 'events.html', label: 'Events' },
      { href: 'create.html', label: 'Create Event' },
      { href: 'leaderboard.html', label: 'Leaderboard' },
    ];

    if (loggedIn) {
      try {
        await window.Auth.fetchProfile();
      } catch (error) {
        loggedIn = window.Auth && window.Auth.isLoggedIn();
      }
    }

    if (loggedIn) {
      links.push({ href: 'profile.html', label: 'Profile' });
    } else {
      links.push({ href: 'login.html', label: 'Login' });
      links.push({ href: 'register.html', label: 'Register' });
    }

    nav.innerHTML = `
      <a href="index.html" class="nav-brand" aria-label="CleanUpConnect Home">
        <img src="assets/icon.png" alt="CleanUpConnect icon" class="nav-brand-logo">
        <span class="nav-brand-text">CleanUpConnect</span>
      </a>
      <div class="nav-links">
        ${links
          .map((link) => {
            const isActive = currentPage === link.href;
            return `<a href="${link.href}" class="nav-link ${isActive ? 'active' : ''}">${link.label}</a>`;
          })
          .join('')}
      </div>
      <div class="nav-actions">
        <button type="button" id="theme-toggle" class="btn btn-ghost nav-theme-toggle">Switch to Dark</button>
        ${
          loggedIn
            ? '<button type="button" id="logout-btn" class="btn btn-ghost">Logout</button>'
            : ''
        }
      </div>
    `;

    document.dispatchEvent(new Event('navbar:rendered'));

    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
      logoutButton.addEventListener('click', function () {
        window.Auth.clearToken();
        window.location.href = 'login.html';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderNavbar);
  } else {
    renderNavbar();
  }
})();
