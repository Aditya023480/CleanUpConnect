const state = {
  selectedState: '',
  selectedCity: '',
  currentPage: 1,
  pageSize: 6,
  totalPages: 0,
  totalEvents: 0,
};

document.addEventListener('DOMContentLoaded', async () => {
  wireFilterControls();
  await loadStates();
  await loadEvents();
});

function wireFilterControls() {
  const stateSelect = document.getElementById('state-select');
  const citySelect = document.getElementById('city-select');

  if (!stateSelect || !citySelect) {
    return;
  }

  stateSelect.addEventListener('change', async (event) => {
    state.selectedState = event.target.value;
    state.selectedCity = '';
    state.currentPage = 1;

    if (state.selectedState) {
      await loadCities(state.selectedState);
      citySelect.disabled = false;
    } else {
      citySelect.disabled = true;
      citySelect.innerHTML = '<option value="">Select a city</option>';
    }

    await loadEvents();
  });

  citySelect.addEventListener('change', async (event) => {
    state.selectedCity = event.target.value;
    state.currentPage = 1;
    await loadEvents();
  });
}

async function loadStates() {
  try {
    const response = await fetch('http://localhost:5000/events/states');
    const states = await response.json();
    const stateSelect = document.getElementById('state-select');

    if (!stateSelect) {
      return;
    }

    stateSelect.innerHTML = '<option value="">Select a state</option>';

    states.forEach((st) => {
      const option = document.createElement('option');
      option.value = st;
      option.textContent = st.charAt(0).toUpperCase() + st.slice(1);
      stateSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading states:', error);
  }
}

async function loadCities(selectedState) {
  try {
    const response = await fetch(`http://localhost:5000/events/cities?state=${encodeURIComponent(selectedState)}`);
    const cities = await response.json();
    const citySelect = document.getElementById('city-select');

    if (!citySelect) {
      return;
    }

    citySelect.innerHTML = '<option value="">Select a city</option>';

    cities.forEach((city) => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city.charAt(0).toUpperCase() + city.slice(1);
      citySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading cities:', error);
  }
}

async function loadEvents() {
  try {
    const params = new URLSearchParams();

    if (state.selectedState) {
      params.set('state', state.selectedState);
    }

    if (state.selectedCity) {
      params.set('city', state.selectedCity);
    }

    params.set('page', String(state.currentPage));
    params.set('limit', String(state.pageSize));

    const response = await fetch(`http://localhost:5000/events?${params.toString()}`);
    const payload = await response.json();
    const events = Array.isArray(payload) ? payload : (payload.data || []);
    const pagination = payload.pagination || {
      page: 1,
      limit: state.pageSize,
      total: events.length,
      total_pages: events.length > 0 ? 1 : 0,
      has_prev: false,
      has_next: false,
    };
    const container = document.getElementById('events-container');

    if (!container) {
      return;
    }

    state.currentPage = pagination.page;
    state.pageSize = pagination.limit;
    state.totalPages = pagination.total_pages;
    state.totalEvents = pagination.total;

    container.innerHTML = '';

    if (events.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'event-card empty-state';
      emptyState.innerHTML = `
        <h2>No events found</h2>
        <p>Try a different state or city to view available events.</p>
      `;
      container.appendChild(emptyState);
      renderPagination();
      return;
    }

    events.forEach((event) => {
      const isLoggedIn = window.Auth && window.Auth.isLoggedIn();
      const isCompleted = Boolean(event.is_completed);
      const card = document.createElement('div');
      card.className = 'event-card';
      card.innerHTML = `
        <h2>${event.title}</h2>
        <p><strong>Status:</strong> <span class="event-status ${isCompleted ? 'completed' : 'open'}">${isCompleted ? 'Completed' : 'Open'}</span></p>
        <p><strong>Location:</strong> ${event.city.charAt(0).toUpperCase() + event.city.slice(1)}, ${event.state.charAt(0).toUpperCase() + event.state.slice(1)}</p>
        <p><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</p>
        <p><strong>Volunteers:</strong> ${event.joined_count} / ${event.volunteers_needed}</p>
        <p><strong>Organizer:</strong> ${event.organizer_username || 'Unknown'}</p>
        <div class="card-actions">
          <button class="btn" onclick="joinEvent(${event.id})" ${isCompleted ? 'disabled' : ''}>${isCompleted ? 'Completed' : (isLoggedIn ? 'Join' : 'Login to Join')}</button>
          <a href="details.html?id=${event.id}" class="btn">View Details</a>
        </div>
      `;
      container.appendChild(card);
    });

    renderPagination();
  } catch (error) {
    console.error('Error loading events:', error);
  }
}

function renderPagination() {
  const controls = document.getElementById('pagination-controls');

  if (!controls) {
    return;
  }

  if (state.totalEvents === 0) {
    controls.innerHTML = '';
    return;
  }

  const totalPages = state.totalPages > 0 ? state.totalPages : 1;
  const prevDisabled = state.currentPage <= 1;
  const nextDisabled = state.currentPage >= totalPages;

  controls.innerHTML = `
    <div class="pagination">
      <button type="button" class="btn btn-ghost pagination-btn" id="pagination-prev" ${prevDisabled ? 'disabled' : ''}>Previous</button>
      <p class="pagination-text">Page ${state.currentPage} of ${totalPages} • ${state.totalEvents} event${state.totalEvents === 1 ? '' : 's'}</p>
      <button type="button" class="btn btn-ghost pagination-btn" id="pagination-next" ${nextDisabled ? 'disabled' : ''}>Next</button>
    </div>
  `;

  const prevButton = document.getElementById('pagination-prev');
  const nextButton = document.getElementById('pagination-next');

  if (prevButton) {
    prevButton.addEventListener('click', async () => {
      if (state.currentPage <= 1) {
        return;
      }
      state.currentPage -= 1;
      await loadEvents();
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', async () => {
      if (state.currentPage >= totalPages) {
        return;
      }
      state.currentPage += 1;
      await loadEvents();
    });
  }
}

async function joinEvent(id) {
  if (!window.Auth || !window.Auth.isLoggedIn()) {
    alert('Please login first to join an event.');
    window.location.href = 'login.html';
    return;
  }

  const token = window.Auth.getToken();

  try {
    const response = await fetch(`http://localhost:5000/events/${id}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const payload = await response.json().catch(() => ({}));

    if (response.status === 401) {
      window.Auth.clearToken();
      alert('Session expired. Please login again.');
      window.location.href = 'login.html';
      return;
    }

    if (!response.ok) {
      alert(payload.error || 'Unable to join this event.');
      return;
    }

    await loadEvents();
  } catch (error) {
    console.error('Error joining event:', error);
  }
}