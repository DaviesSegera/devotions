/* Amen button and reader messages on a devotion page.

   Nothing here runs until assets/firebase-config.js holds real settings, so an
   unconfigured website stays exactly as it was. If Firebase cannot be reached,
   the devotion still reads normally; only these two additions stay hidden.

   Reader messages are never shown until they have been approved on the
   moderation page. Unapproved messages are not readable by visitors at all. */
(function () {
  'use strict';

  var SDK = 'https://www.gstatic.com/firebasejs/12.19.0/';
  var LIMIT = 200;

  var section = document.querySelector('[data-devotion]');
  var amenBox = document.querySelector('[data-amen]');
  if (!section && !amenBox) return;

  var slug = section ? section.getAttribute('data-devotion')
                     : amenBox.getAttribute('data-amen');
  var config = window.DEVOTIONS_FIREBASE;
  if (!config || !config.projectId || /^PASTE/.test(config.projectId)) return;

  var status = document.getElementById('community-status');
  var form = document.getElementById('comment-form');
  var list = document.getElementById('comment-list');
  var emptyNote = document.getElementById('comment-empty');
  var nameField = document.getElementById('comment-name');
  var bodyField = document.getElementById('comment-body');
  var submit = form ? form.querySelector('button[type="submit"]') : null;

  function say(message, kind) {
    if (!status) return;
    status.textContent = message || '';
    status.className = 'community-status' + (kind ? ' ' + kind : '');
  }

  function readableDate(value) {
    var when = value && typeof value.toDate === 'function' ? value.toDate() : null;
    if (!when) return '';
    try {
      return when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (_) {
      return when.toISOString().slice(0, 10);
    }
  }

  function storedName() {
    try { return localStorage.getItem('devo-name') || ''; } catch (_) { return ''; }
  }

  function rememberName(value) {
    try { localStorage.setItem('devo-name', value); } catch (_) {}
  }

  start();

  async function start() {
    var fs, authMod, db, auth;
    try {
      var modules = await Promise.all([
        import(SDK + 'firebase-app.js'),
        import(SDK + 'firebase-firestore.js'),
        import(SDK + 'firebase-auth.js')
      ]);
      var app = modules[0].initializeApp(config);
      fs = modules[1];
      authMod = modules[2];
      db = fs.getFirestore(app);
      auth = authMod.getAuth(app);
    } catch (error) {
      // Offline, blocked, or misconfigured. Leave the devotion exactly as it is.
      console.warn('Devotion extras unavailable:', error && error.message);
      return;
    }

    if (section) section.hidden = false;
    if (amenBox) amenBox.hidden = false;

    // Approved messages and the Amen count are public, so show them before
    // signing anyone in. Reading never waits on writing.
    showComments(fs, db);
    var amen = prepareAmen(fs, db);

    var user = null;
    try {
      user = (await authMod.signInAnonymously(auth)).user;
    } catch (error) {
      console.warn('Anonymous sign-in unavailable:', error && error.message);
    }

    if (amen) amen(user);

    if (!form) return;
    if (!user) {
      form.hidden = true;
      say('Messages cannot be sent just now. Please try again later.', 'bad');
      return;
    }
    enableForm(fs, db, user);
  }

  function enableForm(fs, db, user) {
    if (nameField && !nameField.value) nameField.value = storedName();
    var sending = false;

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (sending) return;

      var name = (nameField.value || '').trim().replace(/\s+/g, ' ');
      var body = (bodyField.value || '').trim();

      if (name.length < 2) { say('Please give a name, so others know who is writing.', 'bad'); nameField.focus(); return; }
      if (name.length > 60) { say('Please use a shorter name.', 'bad'); nameField.focus(); return; }
      if (body.length < 2) { say('Please write your message before sending it.', 'bad'); bodyField.focus(); return; }
      if (body.length > 1500) { say('Please shorten your message a little.', 'bad'); bodyField.focus(); return; }

      sending = true;
      if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }
      say('');

      try {
        await fs.addDoc(fs.collection(db, 'pending'), {
          slug: slug,
          name: name,
          body: body,
          uid: user.uid,
          status: 'pending',
          createdAt: fs.serverTimestamp()
        });
        rememberName(name);
        bodyField.value = '';
        say('Thank you. Your message has been sent, and will appear here once it has been read.', 'good');
      } catch (error) {
        console.warn('Message not sent:', error && error.message);
        say('Your message could not be sent just now. Please try again in a moment.', 'bad');
      } finally {
        sending = false;
        if (submit) { submit.disabled = false; submit.textContent = 'Send your message'; }
      }
    });
  }

  async function showComments(fs, db) {
    if (!list) return;
    try {
      var found = await fs.getDocs(fs.query(
        fs.collection(db, 'devotions', slug, 'comments'),
        fs.orderBy('createdAt', 'asc'),
        fs.limit(LIMIT)
      ));
      list.textContent = '';
      if (found.empty) { if (emptyNote) emptyNote.hidden = false; return; }
      if (emptyNote) emptyNote.hidden = true;

      found.forEach(function (entry) {
        var value = entry.data();
        var item = document.createElement('li');

        var head = document.createElement('div');
        head.className = 'comment-head';

        var who = document.createElement('span');
        who.className = 'comment-name';
        who.textContent = value.name || 'A reader';
        head.appendChild(who);

        var when = readableDate(value.createdAt);
        if (when) {
          var date = document.createElement('span');
          date.className = 'comment-date';
          date.textContent = when;
          head.appendChild(date);
        }

        var text = document.createElement('p');
        text.className = 'comment-body';
        text.textContent = value.body || '';

        item.appendChild(head);
        item.appendChild(text);
        list.appendChild(item);
      });
    } catch (error) {
      console.warn('Messages could not be loaded:', error && error.message);
      if (emptyNote) emptyNote.hidden = false;
    }
  }

  /* Shows the count straight away and returns a function that switches the
     button on once a visitor identity is available. */
  function prepareAmen(fs, db) {
    if (!amenBox) return null;
    var button = amenBox.querySelector('.amen-btn');
    var label = amenBox.querySelector('.amen-label');
    var counter = amenBox.querySelector('.amen-count');
    if (!button || !label) return null;

    var voters = fs.collection(db, 'amens', slug, 'voters');

    async function refresh() {
      if (!counter) return;
      try {
        var total = (await fs.getCountFromServer(voters)).data().count;
        if (total === 0) counter.textContent = 'Be the first to pray this prayer.';
        else if (total === 1) counter.textContent = 'One person has prayed this prayer.';
        else counter.textContent = total.toLocaleString('en-GB') + ' people have prayed this prayer.';
      } catch (_) {
        counter.textContent = '';
      }
    }

    refresh();

    return async function (user) {
      if (!user) { button.disabled = true; return; }

      var mine = fs.doc(db, 'amens', slug, 'voters', user.uid);
      var pressed = false;
      try { pressed = (await fs.getDoc(mine)).exists(); } catch (_) {}

      function paint() {
        button.setAttribute('aria-pressed', String(pressed));
        label.textContent = pressed ? 'Amen' : 'Amen — I prayed this';
      }
      paint();

      var busy = false;
      button.addEventListener('click', async function () {
        if (busy) return;
        busy = true;
        button.disabled = true;
        var wanted = !pressed;
        try {
          if (wanted) await fs.setDoc(mine, { createdAt: fs.serverTimestamp() });
          else await fs.deleteDoc(mine);
          pressed = wanted;
          paint();
          await refresh();
        } catch (error) {
          console.warn('Amen not recorded:', error && error.message);
        } finally {
          busy = false;
          button.disabled = false;
        }
      });
    };
  }
})();
