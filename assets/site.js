(function () {
  'use strict';
  var root = document.documentElement;
  var lamp = document.getElementById('lamp');
  if (lamp) {
    lamp.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'night'));
    lamp.addEventListener('click', function () {
      var night = root.getAttribute('data-theme') !== 'night';
      if (night) root.setAttribute('data-theme', 'night');
      else root.removeAttribute('data-theme');
      lamp.setAttribute('aria-pressed', String(night));
      try { localStorage.setItem('devo-theme', night ? 'night' : 'day'); } catch (_) {}
    });
  }
  var progress = document.getElementById('prog');
  if (progress) {
    function tick() {
      var available = root.scrollHeight - window.innerHeight;
      progress.style.width = (available > 0 ? Math.min(100, Math.max(0, window.scrollY / available * 100)) : 0) + '%';
    }
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  }
  var q = document.getElementById('q');
  if (q) {
    var cards = Array.from(document.querySelectorAll('.card[data-find]'));
    var groups = Array.from(document.querySelectorAll('.group'));
    var count = document.getElementById('count');
    var empty = document.getElementById('empty');
    var featured = document.getElementById('featured');
    function normalise(value) { return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[’']/g, '').replace(/[–—]/g, '-'); }
    function search() {
      var terms = normalise(q.value).trim().split(/\s+/).filter(Boolean);
      var shown = 0;
      cards.forEach(function (card) {
        var haystack = normalise(card.getAttribute('data-find'));
        card.hidden = !terms.every(function (word) { return haystack.includes(word); });
        if (!card.hidden) shown++;
      });
      groups.forEach(function (group) { group.hidden = !group.querySelector('.card:not([hidden])'); });
      featured.hidden = terms.length > 0;
      empty.hidden = shown > 0;
      count.textContent = shown + (shown === 1 ? ' devotion' : ' devotions');
    }
    q.addEventListener('input', search);
    search();
  }
  document.querySelectorAll('[data-share]').forEach(function (button) {
    button.addEventListener('click', async function () {
      var title = document.querySelector('h1').textContent;
      var url = document.querySelector('link[rel="canonical"]').href;
      var status = document.querySelector('.share-status');
      try {
        if (navigator.share) { await navigator.share({title: title, url: url}); return; }
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
          status.textContent = 'Devotion link copied. Share it with someone you want to encourage.';
          return;
        }
      } catch (error) { if (error.name === 'AbortError') return; }
      status.textContent = 'Copy this link to share: ' + url;
    });
  });
})();
