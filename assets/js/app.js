/**
 * Local Deals Finder - Main Application Logic
 */

const STORAGE_KEYS = {
  FAVORITES: 'localDeals_favorites',
  RECENT: 'localDeals_recent',
  SELECTED_PLATFORMS: 'localDeals_platforms',
  THEME: 'localDeals_theme',
  POPUP_TESTED: 'localDeals_popupTested'
};

const MAX_RECENT = 10;

let popupsAllowed = null; // null = unknown, true = allowed, false = blocked

const elements = {
  searchForm: document.getElementById('searchForm'),
  zipCode: document.getElementById('zipCode'),
  searchQuery: document.getElementById('searchQuery'),
  radius: document.getElementById('radius'),
  platformsGrid: document.getElementById('platformsGrid'),
  selectAll: document.getElementById('selectAll'),
  selectNone: document.getElementById('selectNone'),
  saveSearch: document.getElementById('saveSearch'),
  favoritesList: document.getElementById('favoritesList'),
  recentList: document.getElementById('recentList'),
  clearFavorites: document.getElementById('clearFavorites'),
  clearRecent: document.getElementById('clearRecent'),
  toastContainer: document.getElementById('toastContainer'),
  themeToggle: document.getElementById('themeToggle')
};

function init() {
  initTheme();
  renderPlatforms();
  loadSavedPlatformSelections();
  renderFavorites();
  renderRecent();
  attachEventListeners();
  checkPopupPermission();
}

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  setTheme(theme);
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  elements.themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

/**
 * Check if popups are allowed by attempting to open a test window
 * This works reliably on Firefox, Chrome, and other browsers
 */
function checkPopupPermission() {
  // Try to open a blank popup to test permission
  const testPopup = window.open('about:blank', '_blank', 'width=1,height=1,left=-9999,top=-9999');
  
  if (testPopup) {
    // Popup opened successfully - close it immediately
    testPopup.close();
    popupsAllowed = true;
    updatePopupWarning(true);
  } else {
    // Popup was blocked
    popupsAllowed = false;
    updatePopupWarning(false);
  }
}

/**
 * Request popup permission by showing instructions and letting user trigger a popup
 */
function requestPopupPermission() {
  // User-initiated click - try opening a test popup
  const testPopup = window.open('about:blank', '_blank');
  
  if (testPopup) {
    testPopup.close();
    popupsAllowed = true;
    updatePopupWarning(true);
    showToast('Pop-ups enabled! You can now search.', 'success');
  } else {
    popupsAllowed = false;
    showToast('Pop-ups still blocked. Please allow pop-ups in your browser settings.', 'error');
    showPopupInstructions();
  }
}

/**
 * Show browser-specific instructions for enabling popups
 */
function showPopupInstructions() {
  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
  const isChrome = navigator.userAgent.toLowerCase().includes('chrome');
  
  let instructions = '';
  if (isFirefox) {
    instructions = 'Firefox: Click the icon in the address bar and select "Allow pop-ups for this site"';
  } else if (isChrome) {
    instructions = 'Chrome: Click the blocked popup icon in the address bar and select "Always allow"';
  } else {
    instructions = 'Please check your browser settings to allow pop-ups for this site';
  }
  
  showToast(instructions, 'info');
}

/**
 * Update the popup warning UI based on permission status
 */
function updatePopupWarning(allowed) {
  const warningEl = document.querySelector('.popup-warning');
  if (!warningEl) return;
  
  if (allowed) {
    warningEl.classList.add('popup-allowed');
    warningEl.innerHTML = `
      <span class="popup-warning-icon">✅</span>
      <span>Pop-ups enabled! Ready to search multiple platforms.</span>
    `;
  } else {
    warningEl.classList.remove('popup-allowed');
    warningEl.innerHTML = `
      <span class="popup-warning-icon">⚠️</span>
      <span>Pop-ups are blocked. </span>
      <button type="button" class="popup-enable-btn" id="enablePopupsBtn">Click to Enable Pop-ups</button>
    `;
    
    // Attach event listener to the new button
    const enableBtn = document.getElementById('enablePopupsBtn');
    if (enableBtn) {
      enableBtn.addEventListener('click', requestPopupPermission);
    }
  }
}

function renderPlatforms() {
  elements.platformsGrid.innerHTML = PLATFORMS.map(platform => `
    <div class="platform-item">
      <input type="checkbox" id="platform-${platform.id}" name="platforms" value="${platform.id}" checked>
      <label for="platform-${platform.id}">
        <span class="platform-icon">${platform.icon}</span>
        <span class="platform-name">${platform.name}</span>
        ${platform.requiresLogin ? '<span class="platform-badge">Login</span>' : ''}
      </label>
    </div>
  `).join('');
}

function getSelectedPlatforms() {
  const checkboxes = elements.platformsGrid.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

function savePlatformSelections() {
  localStorage.setItem(STORAGE_KEYS.SELECTED_PLATFORMS, JSON.stringify(getSelectedPlatforms()));
}

function loadSavedPlatformSelections() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.SELECTED_PLATFORMS));
    if (saved && Array.isArray(saved)) {
      elements.platformsGrid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = saved.includes(cb.value);
      });
    }
  } catch (e) { /* Use defaults */ }
}

function executeSearch(query, zip, radius, platforms) {
  const selectedPlatforms = PLATFORMS.filter(p => platforms.includes(p.id));
  
  if (selectedPlatforms.length === 0) {
    showToast('Please select at least one platform', 'error');
    return;
  }

  selectedPlatforms.forEach((platform, index) => {
    setTimeout(() => {
      window.open(platform.buildUrl(query, zip, radius), '_blank');
    }, index * 100);
  });

  addToRecent({ query, zip, radius, platforms, timestamp: Date.now() });
  setTimeout(() => showToast(`Opening ${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? 's' : ''}...`, 'success'), 200);
}

function addToRecent(search) {
  let recent = getRecent().filter(r => !(r.query === search.query && r.zip === search.zip));
  recent.unshift(search);
  localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(recent.slice(0, MAX_RECENT)));
  renderRecent();
}

function getRecent() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT)) || []; }
  catch { return []; }
}

function renderRecent() {
  const recent = getRecent();
  
  if (recent.length === 0) {
    elements.recentList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🕐</div>
        <p>Your recent searches will appear here.</p>
      </div>`;
    return;
  }

  elements.recentList.innerHTML = recent.map((item, index) => `
    <div class="saved-item" data-type="recent" data-index="${index}">
      <div class="saved-item-content">
        <span class="saved-item-query">${escapeHtml(item.query)}</span>
        <span class="saved-item-meta">${item.zip} • ${item.radius} mi</span>
      </div>
      <button class="saved-item-delete" data-action="delete-recent" data-index="${index}" title="Remove">✕</button>
    </div>
  `).join('');
}

function getFavorites() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES)) || []; }
  catch { return []; }
}

function saveToFavorites(search) {
  const favorites = getFavorites();
  
  if (favorites.some(f => f.query === search.query && f.zip === search.zip)) {
    showToast('This search is already in favorites', 'error');
    return;
  }

  favorites.push(search);
  localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  renderFavorites();
  showToast('Search saved to favorites!', 'success');
}

function renderFavorites() {
  const favorites = getFavorites();
  
  if (favorites.length === 0) {
    elements.favoritesList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⭐</div>
        <p>No favorites yet. Save a search to quick-launch it later!</p>
      </div>`;
    return;
  }

  elements.favoritesList.innerHTML = favorites.map((item, index) => `
    <div class="saved-item" data-type="favorite" data-index="${index}">
      <div class="saved-item-content">
        <span class="saved-item-query">${escapeHtml(item.query)}</span>
        <span class="saved-item-meta">${item.zip} • ${item.radius} mi</span>
      </div>
      <button class="saved-item-delete" data-action="delete-favorite" data-index="${index}" title="Remove">✕</button>
    </div>
  `).join('');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span><span>${message}</span>`;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function isValidZip(zip) {
  return /^\d{5}$/.test(zip);
}

function attachEventListeners() {
  elements.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = elements.searchQuery.value.trim();
    const zip = elements.zipCode.value.trim();
    const radius = parseInt(elements.radius.value);
    const platforms = getSelectedPlatforms();

    if (!isValidZip(zip)) {
      showToast('Please enter a valid 5-digit ZIP code', 'error');
      elements.zipCode.focus();
      return;
    }
    if (!query) {
      showToast('Please enter a search term', 'error');
      elements.searchQuery.focus();
      return;
    }

    savePlatformSelections();
    executeSearch(query, zip, radius, platforms);
  });

  elements.saveSearch.addEventListener('click', () => {
    const query = elements.searchQuery.value.trim();
    const zip = elements.zipCode.value.trim();
    const radius = parseInt(elements.radius.value);
    const platforms = getSelectedPlatforms();

    if (!query || !isValidZip(zip)) {
      showToast('Enter a valid ZIP code and search term first', 'error');
      return;
    }
    saveToFavorites({ query, zip, radius, platforms, timestamp: Date.now() });
  });

  elements.selectAll.addEventListener('click', () => {
    elements.platformsGrid.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
  });

  elements.selectNone.addEventListener('click', () => {
    elements.platformsGrid.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  });

  elements.clearFavorites.addEventListener('click', () => {
    if (confirm('Clear all favorites?')) {
      localStorage.removeItem(STORAGE_KEYS.FAVORITES);
      renderFavorites();
      showToast('Favorites cleared', 'success');
    }
  });

  elements.clearRecent.addEventListener('click', () => {
    if (confirm('Clear search history?')) {
      localStorage.removeItem(STORAGE_KEYS.RECENT);
      renderRecent();
      showToast('History cleared', 'success');
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-action="delete-favorite"]')) {
      const favorites = getFavorites();
      favorites.splice(parseInt(e.target.dataset.index), 1);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      renderFavorites();
      return;
    }

    if (e.target.matches('[data-action="delete-recent"]')) {
      const recent = getRecent();
      recent.splice(parseInt(e.target.dataset.index), 1);
      localStorage.setItem(STORAGE_KEYS.RECENT, JSON.stringify(recent));
      renderRecent();
      return;
    }

    const savedItem = e.target.closest('.saved-item');
    if (savedItem && !e.target.classList.contains('saved-item-delete')) {
      const items = savedItem.dataset.type === 'favorite' ? getFavorites() : getRecent();
      const item = items[parseInt(savedItem.dataset.index)];
      
      if (item) {
        elements.searchQuery.value = item.query;
        elements.zipCode.value = item.zip;
        elements.radius.value = item.radius;
        
        if (item.platforms && Array.isArray(item.platforms)) {
          elements.platformsGrid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = item.platforms.includes(cb.value);
          });
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('Search loaded - click Search to run it!', 'success');
      }
    }
  });

  elements.zipCode.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
  });

  elements.themeToggle.addEventListener('click', toggleTheme);
}

document.addEventListener('DOMContentLoaded', init);
