/*  Write prayers — a small editor that runs on this computer only.

    Start it by double-clicking "Write prayers.cmd", or with:
        node tools/prayer-editor.cjs

    It opens a page in your browser where you choose a devotion, type its
    prayer, and save. Saving writes straight into devotions.json. Nothing is
    sent anywhere: the page is served by this computer to this computer, behind
    a one-time key that changes every time you start it.

    Close the window and press Ctrl+C here when you have finished.            */

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const catalogue = path.join(root, 'devotions.json');
const KEY = crypto.randomBytes(16).toString('hex');
const MAX = 4000;

const read = () => JSON.parse(fs.readFileSync(catalogue, 'utf8'));
const write = data => fs.writeFileSync(catalogue, JSON.stringify(data, null, 2) + '\n');

/* Keeps the prayer next to the summary, so the file stays easy to read. */
function withPrayer(devotion, prayer) {
  const out = {};
  for (const [key, value] of Object.entries(devotion)) {
    if (key === 'prayer') continue;
    out[key] = value;
    if (key === 'summary' && prayer) out.prayer = prayer;
  }
  if (prayer && !('prayer' in out)) out.prayer = prayer;
  return out;
}

function send(response, code, type, body) {
  response.writeHead(code, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(body);
}

const json = (response, code, value) => send(response, code, 'application/json; charset=utf-8', JSON.stringify(value));

function body(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', chunk => {
      raw += chunk;
      if (raw.length > 100000) { reject(new Error('Too much text.')); request.destroy(); }
    });
    request.on('end', () => { try { resolve(JSON.parse(raw || '{}')); } catch (error) { reject(error); } });
    request.on('error', reject);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  if (url.searchParams.get('k') !== KEY) return send(response, 403, 'text/plain; charset=utf-8', 'Start the editor again to get a fresh link.');

  try {
    if (request.method === 'GET' && url.pathname === '/') {
      return send(response, 200, 'text/html; charset=utf-8', page());
    }

    if (request.method === 'GET' && url.pathname === '/catalogue') {
      const data = read();
      return json(response, 200, {
        author: data.author,
        devotions: data.devotions.map(d => ({
          slug: d.slug, title: d.title, passage: d.passage,
          testament: d.testament, prayer: d.prayer || ''
        }))
      });
    }

    if (request.method === 'POST' && url.pathname === '/save') {
      const { slug, prayer } = await body(request);
      const text = String(prayer == null ? '' : prayer).replace(/\r\n/g, '\n').trim();
      if (text.length > MAX) return json(response, 400, { error: `A prayer may be up to ${MAX} characters. This one is ${text.length}.` });

      const data = read();
      const at = data.devotions.findIndex(d => d.slug === slug);
      if (at < 0) return json(response, 400, { error: 'That devotion is not in devotions.json.' });

      data.devotions[at] = withPrayer(data.devotions[at], text);
      write(data);
      return json(response, 200, { ok: true, saved: text, written: text ? 'saved' : 'removed' });
    }

    if (request.method === 'POST' && url.pathname === '/publish') {
      try {
        const output = execFileSync(process.execPath, [path.join(__dirname, 'update-site.cjs')], { cwd: root, encoding: 'utf8' });
        return json(response, 200, { ok: true, output: output.trim() });
      } catch (error) {
        return json(response, 200, { ok: false, output: String(error.stderr || error.stdout || error.message).trim() });
      }
    }

    return send(response, 404, 'text/plain; charset=utf-8', 'Not found');
  } catch (error) {
    return json(response, 500, { error: error.message });
  }
});

server.listen(0, '127.0.0.1', () => {
  const address = `http://127.0.0.1:${server.address().port}/?k=${KEY}`;
  console.log('\n  Write prayers — the editor is ready.\n');
  console.log('  ' + address + '\n');
  console.log('  If your browser did not open, copy the line above into it.');
  console.log('  Press Ctrl+C here when you have finished.\n');
  try {
    if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', address], { detached: true, stdio: 'ignore' }).unref();
    else if (process.platform === 'darwin') spawn('open', [address], { detached: true, stdio: 'ignore' }).unref();
    else spawn('xdg-open', [address], { detached: true, stdio: 'ignore' }).unref();
  } catch (_) { /* The address above still works. */ }
});

function page() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Write prayers — A New Beginning</title>
<style>
  :root{
    --bg:#f3efe6;--surface:#fffdf8;--surface-2:#f8f3e8;--ink:#24211a;--ink-soft:#544e3f;
    --muted:#736d5e;--indigo:#1e2340;--indigo-3:#3b4780;--gold:#b08a2a;--gold-bright:#d6ab3c;
    --gold-pale:#eadfbd;--gold-soft:#fbf4df;--wine:#7a3b2e;--rule:#e3dccb;
    --f-ui:'Segoe UI',system-ui,sans-serif;--f-body:Georgia,'Times New Roman',serif;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:var(--bg);color:var(--ink);font-family:var(--f-body);height:100vh;display:flex;flex-direction:column}
  header{background:var(--indigo);color:#f4efe2;padding:14px 22px;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
  header h1{font-family:var(--f-ui);font-size:1.05rem;font-weight:700;letter-spacing:.4px}
  header .hint{font-family:var(--f-ui);font-size:.78rem;color:#c9c2ab}
  .shell{flex:1;display:grid;grid-template-columns:290px minmax(0,1fr);min-height:0}
  .list{background:var(--surface-2);border-right:1px solid var(--rule);overflow:auto;padding:12px 0}
  .list button{display:block;width:100%;text-align:left;background:none;border:0;cursor:pointer;
    padding:11px 20px;font-family:var(--f-body);font-size:.95rem;color:var(--ink);border-left:3px solid transparent}
  .list button:hover{background:var(--gold-soft)}
  .list button.on{background:var(--surface);border-left-color:var(--gold-bright);font-weight:600}
  .list .ref{display:block;font-family:var(--f-ui);font-size:.72rem;color:var(--muted);margin-top:2px}
  .list .dot{float:right;color:var(--gold);font-size:1.1rem;line-height:1}
  .list h2{font-family:var(--f-ui);font-size:.68rem;letter-spacing:2px;text-transform:uppercase;
    color:var(--muted);padding:14px 20px 6px}
  .work{overflow:auto;padding:26px 30px 40px}
  .work h2{font-family:var(--f-body);font-size:1.5rem;margin-bottom:3px}
  .work .sub{font-family:var(--f-ui);font-size:.8rem;color:var(--muted);margin-bottom:20px}
  label{display:block;font-family:var(--f-ui);font-weight:700;font-size:.72rem;letter-spacing:1.6px;
    text-transform:uppercase;color:var(--muted);margin-bottom:7px}
  textarea{width:100%;min-height:230px;font-family:var(--f-body);font-size:1.02rem;line-height:1.7;
    color:var(--ink);background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:14px 16px;resize:vertical}
  textarea:focus{outline:2px solid var(--gold-bright);outline-offset:1px}
  .bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:14px 0 8px}
  .btn{font-family:var(--f-ui);font-weight:700;font-size:13.5px;padding:10px 16px;border-radius:9px;
    border:1px solid transparent;cursor:pointer}
  .btn.gold{background:var(--gold-bright);color:var(--indigo)}
  .btn.indigo{background:var(--indigo);color:#f4efe2}
  .btn.ghost{background:var(--surface);color:var(--ink);border-color:var(--rule)}
  .btn[disabled]{opacity:.5;cursor:default}
  .count{font-family:var(--f-ui);font-size:.78rem;color:var(--muted);margin-left:auto}
  .say{font-family:var(--f-ui);font-size:.88rem;min-height:1.3em;margin-bottom:18px}
  .say.good{color:var(--gold);font-weight:700}
  .say.bad{color:var(--wine);font-weight:700}
  .preview{border:1px solid var(--gold-pale);border-left:4px solid var(--gold-bright);border-radius:14px;
    background:var(--gold-soft);padding:26px 30px}
  .preview h3{font-family:var(--f-ui);font-weight:800;font-size:.8rem;letter-spacing:2.6px;
    text-transform:uppercase;color:var(--gold);text-align:center;margin-bottom:16px}
  .preview p{font-style:italic;font-size:1.2rem;line-height:1.72;margin-bottom:.85em}
  .preview p:last-child{margin-bottom:0}
  .preview .sign{font-family:var(--f-ui);font-style:normal;font-weight:700;font-size:.72rem;
    letter-spacing:1.4px;text-transform:uppercase;color:var(--gold);text-align:right;margin-top:16px}
  .preview .none{color:var(--muted);font-style:italic;font-size:1rem;text-align:center}
  pre.out{background:var(--surface);border:1px solid var(--rule);border-radius:10px;padding:14px 16px;
    font-size:.82rem;white-space:pre-wrap;margin-top:16px;font-family:ui-monospace,Consolas,monospace}
  [hidden]{display:none!important}
</style>
</head>
<body>

<header>
  <h1>Write prayers</h1>
  <span class="hint">Saving writes into devotions.json · Ctrl+S to save</span>
</header>

<div class="shell">
  <nav class="list" id="list"></nav>
  <main class="work">
    <div id="blank">
      <h2>Choose a devotion</h2>
      <p class="sub">Pick one on the left, type its prayer, and save. A gold dot marks the devotions that already have one.</p>
    </div>
    <div id="editor" hidden>
      <h2 id="title"></h2>
      <p class="sub" id="passage"></p>
      <label for="text">The prayer</label>
      <textarea id="text" placeholder="Leave a blank line between paragraphs."></textarea>
      <div class="bar">
        <button class="btn gold" type="button" id="save">Save prayer</button>
        <button class="btn indigo" type="button" id="publish">Save, then update the website</button>
        <button class="btn ghost" type="button" id="clear">Remove this prayer</button>
        <span class="count" id="count"></span>
      </div>
      <p class="say" id="say" role="status"></p>
      <div class="preview" id="preview"></div>
      <pre class="out" id="out" hidden></pre>
    </div>
  </main>
</div>

<script>
const KEY = new URLSearchParams(location.search).get('k');
const api = (path, options) => fetch(path + '?k=' + KEY, options);
const $ = id => document.getElementById(id);

let devotions = [], author = '', current = null;

function say(text, kind) {
  $('say').textContent = text || '';
  $('say').className = 'say' + (kind ? ' ' + kind : '');
}

function paragraphs(text) {
  return String(text).replace(/\\r\\n/g, '\\n').trim().split(/\\n\\s*\\n/).map(p => p.trim()).filter(Boolean);
}

function drawPreview() {
  const parts = paragraphs($('text').value);
  const box = $('preview');
  box.textContent = '';
  const head = document.createElement('h3');
  head.textContent = 'A prayer for today';
  box.appendChild(head);
  if (!parts.length) {
    const none = document.createElement('p');
    none.className = 'none';
    none.textContent = 'Nothing yet. What you type appears here, exactly as readers will see it.';
    box.appendChild(none);
    return;
  }
  for (const part of parts) {
    const p = document.createElement('p');
    p.textContent = part;
    box.appendChild(p);
  }
  const sign = document.createElement('p');
  sign.className = 'sign';
  sign.textContent = '— ' + author;
  box.appendChild(sign);
}

function drawCount() {
  const n = $('text').value.trim().length;
  $('count').textContent = n ? n + ' of 4000 characters' : '';
}

function drawList() {
  const list = $('list');
  list.textContent = '';
  for (const group of ['old', 'new']) {
    const head = document.createElement('h2');
    head.textContent = group === 'old' ? 'Old Testament' : 'New Testament';
    list.appendChild(head);
    for (const d of devotions.filter(x => x.testament === group)) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = current && current.slug === d.slug ? 'on' : '';
      if (d.prayer) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.textContent = '\\u2726';
        dot.title = 'A prayer is saved';
        button.appendChild(dot);
      }
      button.appendChild(document.createTextNode(d.title));
      const ref = document.createElement('span');
      ref.className = 'ref';
      ref.textContent = d.passage;
      button.appendChild(ref);
      button.addEventListener('click', () => choose(d));
      list.appendChild(button);
    }
  }
}

function choose(d) {
  current = d;
  $('blank').hidden = true;
  $('editor').hidden = false;
  $('title').textContent = d.title;
  $('passage').textContent = d.passage;
  $('text').value = d.prayer || '';
  $('out').hidden = true;
  say('');
  drawPreview();
  drawCount();
  drawList();
  $('text').focus();
}

async function save(quiet) {
  if (!current) return false;
  $('save').disabled = $('publish').disabled = true;
  try {
    const result = await (await api('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: current.slug, prayer: $('text').value })
    })).json();
    if (result.error) { say(result.error, 'bad'); return false; }
    current.prayer = result.saved;
    drawList();
    if (!quiet) say(result.written === 'removed'
      ? 'Removed. Run the website update to take it off the page.'
      : 'Saved into devotions.json. Update the website to put it on the page.', 'good');
    return true;
  } catch (error) {
    say('Could not save: ' + error.message, 'bad');
    return false;
  } finally {
    $('save').disabled = $('publish').disabled = false;
  }
}

$('text').addEventListener('input', () => { drawPreview(); drawCount(); });
$('save').addEventListener('click', () => save(false));

$('clear').addEventListener('click', () => {
  $('text').value = '';
  drawPreview();
  drawCount();
  save(false);
});

$('publish').addEventListener('click', async () => {
  if (!await save(true)) return;
  say('Updating the website…');
  $('save').disabled = $('publish').disabled = true;
  try {
    const result = await (await api('/publish', { method: 'POST' })).json();
    $('out').hidden = false;
    $('out').textContent = result.output || '';
    say(result.ok ? 'Saved, and the website has been updated. Commit the folder to publish it.'
                  : 'Saved, but the website update stopped. The message below says why.',
        result.ok ? 'good' : 'bad');
  } catch (error) {
    say('Could not run the update: ' + error.message, 'bad');
  } finally {
    $('save').disabled = $('publish').disabled = false;
  }
});

document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') { event.preventDefault(); save(false); }
});

(async function load() {
  const data = await (await api('/catalogue')).json();
  devotions = data.devotions;
  author = data.author;
  drawList();
})();
</script>
</body>
</html>`;
}
