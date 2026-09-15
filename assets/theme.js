try {
  if (localStorage.getItem('devo-theme') === 'night') {
    document.documentElement.setAttribute('data-theme', 'night');
  }
} catch (_) { /* Reading still works when storage is unavailable. */ }
