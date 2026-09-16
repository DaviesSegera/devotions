/* Run from any folder: node tools/update-site.cjs
   No packages or network access are required. See README.md for daily updates. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const checkOnly = process.argv.includes('--check');
const config = JSON.parse(fs.readFileSync(path.join(root, 'devotions.json'), 'utf8'));
const {siteUrl, siteName, author, youtubeChannel, topics, devotions} = config;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// A prayer is typed as plain text. Blank lines separate its paragraphs.
const paragraphs = text => String(text).replace(/\r\n/g,'\n').trim().split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean).map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');
const json = o => JSON.stringify(o).replace(/</g, '\\u003c');
const absolute = route => siteUrl + (route === 'index.html' ? '' : route);
const route = d => d.slug + '.html';
const videoRoute = (d,v) => `watch/${d.slug}-${v.kind}.html`;
const topicRoute = t => `topics/${t.slug}.html`;
const topicById = new Map(topics.map(t => [t.slug,t]));
const latest = devotions.find(d=>d.slug===config.latest);
const slugs = new Set();
if (!siteUrl.endsWith('/') || !siteUrl.startsWith('https://') || !latest) throw Error('Check siteUrl and latest in devotions.json.');
for(const d of devotions) {
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug)||slugs.has(d.slug))throw Error('Invalid or duplicate devotion slug: '+d.slug);
 slugs.add(d.slug);
 for(const field of ['title','passage','subject','summary','keyVerse','keyVerseReference'])if(!d[field]?.trim())throw Error(`Missing ${field}: ${d.slug}`);
 if(!['old','new'].includes(d.testament)||!Number.isInteger(d.readingMinutes)||d.readingMinutes<1)throw Error('Invalid reading details: '+d.slug);
 if(!d.topics?.length||d.topics.some(t=>!topicById.has(t)))throw Error('Unknown or missing topic: '+d.slug);
 if(!Array.isArray(d.videos))throw Error('Missing videos array: '+d.slug);
 const kinds=new Set();
 for(const v of d.videos){
  if(!/^[\w-]{11}$/.test(v.id)||!['short','film'].includes(v.kind)||kinds.has(v.kind)||!v.title)throw Error('Invalid video: '+d.slug);
  kinds.add(v.kind);
  if(v.uploadDate && (!/^\d{4}-\d{2}-\d{2}$/.test(v.uploadDate)||!v.uploadDateSource||new Date(v.uploadDate).toISOString().slice(0,10)!==v.uploadDate))throw Error('Use a verified ISO upload date and source: '+v.id);
 }
 if(d.publishedDate && (!/^\d{4}-\d{2}-\d{2}$/.test(d.publishedDate)||new Date(d.publishedDate).toISOString().slice(0,10)!==d.publishedDate))throw Error('Invalid devotion publication date: '+d.slug);
 if(d.prayer!==undefined){
  if(typeof d.prayer!=='string'||!d.prayer.trim())throw Error('Remove the prayer field rather than leaving it empty: '+d.slug);
  if(d.prayer.length>4000)throw Error('Prayer is longer than 4000 characters: '+d.slug);
 }
}
const outputs = new Map();
const set = (file, content) => outputs.set(file, content.trim()+'\n');
const authorSchema = {'@type':'Person','@id':absolute('about.html')+'#author',name:author,url:absolute('about.html')};
function breadcrumbs(items) {
 return {'@type':'BreadcrumbList',itemListElement:items.map(([name,url],i)=>({'@type':'ListItem',position:i+1,name,item:absolute(url)}))};
}
function shell(file,title,description,body,schemas=[],options={}) {
 const prefix = '../'.repeat(file.split('/').length-1);
 const current=absolute(file);
 const kind=options.article?'article':'website';
 return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="author" content="${esc(author)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#1e2340">
${config.googleSiteVerification?`<meta name="google-site-verification" content="${esc(config.googleSiteVerification)}">`:''}
<link rel="canonical" href="${current}">
<meta property="og:type" content="${kind}">
<meta property="og:site_name" content="${esc(siteName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${current}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<link rel="alternate" type="application/rss+xml" title="A New Beginning — Daily Devotions" href="${prefix}feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&amp;family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&amp;family=Lora:ital,wght@0,400;0,600;1,400&amp;family=Manrope:wght@600;700;800&amp;family=Pinyon+Script&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="${prefix}assets/base.css">
<link rel="stylesheet" href="${prefix}assets/discover.css">${options.community?`
<link rel="stylesheet" href="${prefix}assets/community.css">`:''}
<script src="${prefix}assets/theme.js"></script>
<script type="application/ld+json">${json({'@context':'https://schema.org','@graph':schemas})}</script>
<script src="${prefix}assets/site.js" defer></script>${options.community?`
<script src="${prefix}assets/firebase-config.js" defer></script>
<script src="${prefix}assets/community.js" defer></script>`:''}
</head>
<body id="top">
<a class="skip-link" href="#main">Skip to content</a>
${options.article?'<div class="progress" id="prog" aria-hidden="true"></div>':''}
<header class="topbar"><div class="in">
 <a class="brand" href="${prefix}index.html"><span class="mark" aria-hidden="true">✦</span><span class="t"><small>A New Beginning</small>Daily Devotions</span></a>
 <nav aria-label="Main navigation"><a class="nav-topic" href="${prefix}topics.html">Topics</a><a href="${prefix}videos.html">Videos</a><a href="${prefix}follow.html">Follow</a><button class="lamp" id="lamp" type="button" aria-label="Night reading" aria-pressed="false" title="Night reading"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z"/></svg></button></nav>
</div></header>
${body}
<footer class="site-foot"><nav aria-label="Footer navigation"><a href="${prefix}index.html">All devotions</a><a href="${prefix}topics.html">Browse topics</a><a href="${prefix}videos.html">Watch videos</a><a href="${prefix}follow.html">Follow new devotions</a><a href="${prefix}about.html">About</a></nav>
<span class="l">Scripture quotations are from the <em>Holy Bible, New Living Translation</em>. Ellen G. White quotations are cited to book, page and paragraph.</span>
<span class="l">Videos: <a href="${youtubeChannel}" target="_blank" rel="noopener">I Can Still Believe on YouTube</a></span>
<span class="l small">Prepared by ${esc(author)} · Free to read, and free to share with anyone.</span></footer>
</body></html>`;
}
function chips(d,prefix='') { return d.topics.map(id=>`<a href="${prefix}${topicRoute(topicById.get(id))}">${esc(topicById.get(id).title)}</a>`).join(''); }
function topicLinks(prefix='') {return topics.map(t=>`<a href="${prefix}${topicRoute(t)}">${esc(t.title)}</a>`).join('');}
function card(d,prefix='',heading='h3') {
 const find=[d.title,d.passage,d.subject,d.summary,...d.topics.map(t=>topicById.get(t).title)].join(' ');
 return `<a class="card${d.videos.length?'':' reading-only'}" href="${prefix}${route(d)}" data-find="${esc(find)}">${d.videos.length?`<span class="th"><img src="https://i.ytimg.com/vi/${d.videos[0].id}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360"><span class="pl" aria-hidden="true"></span></span>`:''}<span class="tx"><span class="passage">${esc(d.passage)}<span class="mins"> · ${d.readingMinutes} min read</span></span><${heading}>${esc(d.title)}</${heading}><span class="card-summary">${esc(d.summary)}</span><span class="card-action">Read devotion${d.videos.length?` · ${d.videos.length>1?'Short & full film':'Short video'}`:''}</span></span></a>`;
}
function related(d,prefix='') {
 return devotions.filter(x=>x.slug!==d.slug).map((x,i)=>({d:x,score:x.topics.filter(t=>d.topics.includes(t)).length,i})).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,3).map(x=>card(x.d,prefix)).join('');
}
function followPanel(prefix='') {return `<aside class="follow-panel"><h2>Make room for a daily devotion</h2><p>Return for new Bible reflections, or follow the devotions in your favourite feed reader. Watch the stories on I Can Still Believe.</p><div class="btns"><a class="btn indigo" href="${prefix}follow.html">Follow new devotions</a><a class="btn ghost" href="${youtubeChannel}" target="_blank" rel="noopener">Visit the YouTube channel</a></div></aside>`;}
function hero(title,subtitle,eyebrow='A New Beginning',extra='') {return `<div class="hero home"><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1>${subtitle?`<p class="standfirst">${esc(subtitle)}</p>`:''}${extra}</div>`;}
function collection(file,title,description,content,items) {
 const schema={'@type':'CollectionPage','@id':absolute(file),name:title,description,url:absolute(file),inLanguage:'en',mainEntity:{'@type':'ItemList',itemListElement:items.map(([name,url],i)=>({'@type':'ListItem',position:i+1,name,url:absolute(url)}))}};
 return shell(file,title+' | '+siteName,description,hero(title,description)+`<main class="wrap" id="main">${content}</main>`,[schema]);
}
// Preserve the exact authored devotion body. All generated additions stay outside these markers.
for(const d of devotions) {
 const file=route(d), original=fs.readFileSync(path.join(root,file),'utf8');
 let content=original.match(/<!-- DEVOTION CONTENT START -->\n([\s\S]*?)\n<!-- DEVOTION CONTENT END -->/);
 if(content) content=content[1];
 else {
  const article=original.match(/<article class="page">([\s\S]*?)<\/article>/);
  if(!article)throw Error('Missing article in '+file);
  const start=article[1].indexOf('<section class="verse-card">');
  const end=article[1].search(/<div class="watch"/);
  if(start<0||end<0)throw Error('Keep the verse-card and watch markers in '+file);
  content=article[1].slice(start,end).trim();
 }
 const videoButtons=d.videos.map(v=>`<a class="btn ${v.kind==='short'?'wine':'ghost'}" href="${videoRoute(d,v)}">Watch the ${v.kind==='short'?'Short':'full film'}</a>`).join('');
 const videos=d.videos.map(v=>`<section class="reading-video"><h3>${esc(v.title)}</h3><div class="embed ${v.kind}"><iframe src="https://www.youtube-nocookie.com/embed/${v.id}?rel=0&amp;playsinline=1" title="${esc(v.title)}" width="${v.kind==='short'?315:560}" height="${v.kind==='short'?560:315}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><p><a href="${videoRoute(d,v)}">Open the ${v.kind==='short'?'Short':'full film'} watch page</a> · <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">Watch on YouTube</a></p></section>`).join('');
 // The prayer is authored in devotions.json. Use "Write prayers.cmd" to add one.
 const prayerBlock=d.prayer?`
<section class="prayer-card" id="prayer" aria-labelledby="prayer-heading">
<h2 id="prayer-heading">A prayer for today</h2>
<div class="prayer-text">${paragraphs(d.prayer)}</div>
<p class="prayer-sign">— ${esc(author)}</p>
<div class="amen" data-amen="${esc(d.slug)}" hidden><button class="btn gold amen-btn" type="button" aria-pressed="false"><span class="amen-label">Amen — I prayed this</span></button><p class="amen-count" role="status"></p></div>
</section>`:'';
 // Readers' messages. Hidden until assets/firebase-config.js holds real settings,
 // and each message is shown only after it has been approved.
 const communityBlock=`
<section class="community" id="community" data-devotion="${esc(d.slug)}" hidden>
<h2>Share a word</h2>
<p class="community-intro">Add a reflection of your own, or a prayer for someone who needs one. Give a name you are happy for other readers to see. Every message is read by ${esc(author)} before it appears here.</p>
<ol class="comment-list" id="comment-list"></ol>
<p class="comment-empty" id="comment-empty" hidden>No words have been shared yet. Yours can be the first.</p>
<form class="comment-form" id="comment-form" novalidate>
<div class="field"><label for="comment-name">Your name</label><input id="comment-name" name="name" type="text" maxlength="60" autocomplete="name" required></div>
<div class="field"><label for="comment-body">Your message</label><textarea id="comment-body" name="body" rows="5" maxlength="1500" required></textarea></div>
<div class="comment-actions"><button class="btn indigo" type="submit">Send your message</button><span class="comment-hint">It appears once it has been read.</span></div>
</form>
<p class="community-status" id="community-status" role="status"></p>
</section>`;
 const body=`<div class="hero"><div class="eyebrow">A New Beginning · Bible devotion</div><h1>${esc(d.title)}</h1><div class="meta">${esc(d.passage)} <span>·</span> ${d.readingMinutes} min read</div></div>
<main id="main"><article class="page">
<div class="reading-intro"><p class="byline">By <a href="about.html">${esc(author)}</a>${d.publishedDate?` · <time datetime="${d.publishedDate}">${d.publishedDate}</time>`:''}</p><p>${esc(d.summary)}</p><nav class="topic-chips" aria-label="Devotion topics">${chips(d)}</nav><div class="btns">${videoButtons}<button class="btn ghost" type="button" data-share>Share devotion</button></div><p class="share-status" role="status"></p></div>
<!-- DEVOTION CONTENT START -->
${content}
<!-- DEVOTION CONTENT END -->${prayerBlock}
${d.videos.length?`<section class="watch-section" id="watch"><h2>Watch this Bible story</h2><p>Reflect on the story in the accompanying ${d.videos.length>1?'Short and full film':'Short'} from I Can Still Believe.</p>${videos}</section>`:''}${communityBlock}
<div class="sdg">Soli Deo Gloria</div></article>
<section class="wrap related"><h2>Continue your reflection</h2><div class="grid">${related(d)}</div>${followPanel()}</section></main>`;
 const article={'@type':'Article','@id':absolute(file)+'#article',headline:d.title,description:d.summary,url:absolute(file),mainEntityOfPage:absolute(file),inLanguage:'en',author:authorSchema,isAccessibleForFree:true,articleSection:d.topics.map(t=>topicById.get(t).title),about:{'@type':'Thing',name:d.passage},...(d.publishedDate?{datePublished:d.publishedDate}:{})};
 set(file,shell(file,`${d.title} | ${d.passage} Devotion`,d.summary,body,[article,breadcrumbs([['Daily devotions','index.html'],[d.title,file]])],{article:true,community:true}));
}
const search=`<div class="search"><label class="sr-only" for="q">Search by topic, title, person or Bible passage</label><input id="q" type="search" autocomplete="off" placeholder="Search prayer, hope, a name or a Bible passage…"><p class="count" id="count" role="status" aria-live="polite">${devotions.length} devotions</p></div>`;
const groups=['old','new'].map(testament=>`<section class="group"><div class="sec-head"><h2>${testament==='old'?'Old':'New'} Testament</h2></div><div class="grid">${devotions.filter(d=>d.testament===testament).map(d=>card(d)).join('')}</div></section>`).join('');
const featured=`<section id="featured" aria-labelledby="latest-title"><div class="featured${latest.videos.length?'':' reading-only'}"><div class="fx"><span class="k">Latest devotion</span><h2 id="latest-title">${esc(latest.title)}</h2><div class="sub">${esc(latest.passage)} · ${latest.readingMinutes} min read</div><p>${esc(latest.summary)}</p><p class="verse">${esc(latest.keyVerse)}</p><p class="ref">${esc(latest.keyVerseReference)}</p><div class="btns"><a class="btn indigo" href="${route(latest)}">Read the devotion</a>${latest.videos.length?`<a class="btn wine" href="${videoRoute(latest,latest.videos[0])}">Watch the Short</a>`:''}</div></div>${latest.videos.length?`<div class="fm"><a href="${videoRoute(latest,latest.videos[0])}" aria-label="Watch ${esc(latest.videos[0].title)}"><img src="https://i.ytimg.com/vi/${latest.videos[0].id}/hqdefault.jpg" alt="" width="480" height="360" fetchpriority="high"><span class="tag">Short</span><span class="play" aria-hidden="true"></span></a></div>`:''}</div></section>`;
const homeDescription='Daily Christian devotions rooted in Scripture, with reflections, practical takeaways, and Bible story videos to encourage faith, prayer, and hope.';
set('index.html',shell('index.html','Daily Christian Devotions & Bible Videos | A New Beginning',homeDescription,hero('Daily Christian Devotions','Find encouragement in Scripture, reflect on its meaning for your life, and watch the Bible story. New devotions are added regularly.','A New Beginning',search)+`<main class="wrap" id="main"><section class="topic-intro"><h2>What is on your heart today?</h2><nav class="topic-chips" aria-label="Browse spiritual topics">${topicLinks()}</nav></section>${featured}${groups}<p class="empty" id="empty" hidden>No devotion matches your search. Try “prayer”, “hope”, a name, or a Bible passage.</p>${followPanel()}</main>`,[{'@type':'WebSite','@id':siteUrl+'#website',name:siteName,alternateName:'A New Beginning — Daily Devotions',url:siteUrl,description:homeDescription,inLanguage:'en'}, {'@type':'CollectionPage',url:siteUrl,name:'Daily Christian Devotions',mainEntity:{'@type':'ItemList',itemListElement:devotions.map((d,i)=>({'@type':'ListItem',position:i+1,name:d.title,url:absolute(route(d))}))}}]));
set('topics.html',collection('topics.html','Devotions by topic','Choose a theme for your prayer and reflection. Each collection brings together Scripture, daily encouragement, and accompanying Bible story videos.',`<div class="topic-grid">${topics.map(t=>`<a class="topic-tile" href="${topicRoute(t)}"><h2>${esc(t.title)}</h2><p>${esc(t.description)}</p><span>${devotions.filter(d=>d.topics.includes(t.slug)).length} devotions</span></a>`).join('')}</div>`,topics.map(t=>[t.title,topicRoute(t)])));
for(const t of topics) {
 const selected=devotions.filter(d=>d.topics.includes(t.slug));
 set(topicRoute(t),collection(topicRoute(t),`${t.title} Devotions`,t.description,`<p class="backlink"><a href="../topics.html">All topics</a> · ${selected.length} devotions</p><div class="grid">${selected.map(d=>card(d,'../','h2')).join('')}</div>${followPanel('../')}`,selected.map(d=>[d.title,route(d)])));
}
const allVideos=devotions.flatMap(d=>d.videos.map(v=>({d,v})));
const videoCard=({d,v})=>`<a class="video-card" href="${videoRoute(d,v)}"><img src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="" width="480" height="360" loading="lazy"><span class="video-card-copy"><span class="eyebrow">${v.kind==='short'?'Short':'Full film'} · ${esc(d.passage)}</span><h3>${esc(v.title)}</h3><span>${esc(d.title)}</span></span></a>`;
set('videos.html',collection('videos.html','Bible story videos','Watch Shorts and full films from I Can Still Believe, then explore the Scripture and reflection in the accompanying devotion.',`<section><h2>Full films</h2><div class="video-grid">${allVideos.filter(x=>x.v.kind==='film').map(videoCard).join('')}</div></section><section><h2>Short reflections</h2><div class="video-grid">${[...allVideos.filter(x=>x.d.slug===latest.slug&&x.v.kind==='short'),...allVideos.filter(x=>x.d.slug!==latest.slug&&x.v.kind==='short')].map(videoCard).join('')}</div></section>`,allVideos.map(({d,v})=>[v.title,videoRoute(d,v)])));
for(const {d,v} of allVideos) {
 const file=videoRoute(d,v);
 const desc=`${v.kind==='short'?'A short Bible reflection':'A Bible story film'} on ${d.passage}. ${d.summary}`;
 const video={'@type':'VideoObject','@id':absolute(file)+'#video',name:v.title,description:desc,thumbnailUrl:`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,uploadDate:v.uploadDate,embedUrl:`https://www.youtube-nocookie.com/embed/${v.id}`,url:absolute(file),inLanguage:'en',isAccessibleForFree:true};
 // Google requires a verified uploadDate for VideoObject. A complete video sitemap
 // covers every watch page even where that historical date is not yet known.
 const schemas=[{'@type':'WebPage',url:absolute(file),name:v.title,description:desc,inLanguage:'en',...(v.uploadDate?{mainEntity:{'@id':absolute(file)+'#video'}}:{})},breadcrumbs([['Daily devotions','index.html'],['Bible story videos','videos.html'],[v.title,file]])];
 if(v.uploadDate)schemas.push(video);
 const body=`<main class="watch-page" id="main"><p class="backlink"><a href="../videos.html">All videos</a> · ${esc(d.passage)} · ${v.kind==='short'?'Short':'Full film'}</p><h1>${esc(v.title)}</h1><div class="embed ${v.kind}"><iframe src="https://www.youtube-nocookie.com/embed/${v.id}?rel=0&amp;playsinline=1" title="${esc(v.title)}" width="${v.kind==='short'?315:960}" height="${v.kind==='short'?560:540}" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><p class="video-description">${esc(desc)}</p>${v.uploadDate?`<p class="byline">Published on YouTube <time datetime="${v.uploadDate}">${v.uploadDate}</time></p>`:''}<p class="video-source">From <a href="${youtubeChannel}" target="_blank" rel="noopener">I Can Still Believe</a> · <a href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">Open on YouTube</a></p><section class="watch-reading"><h2>Read and reflect</h2><h3><a href="../${route(d)}">${esc(d.title)}</a></h3><blockquote>${esc(d.keyVerse)}<cite>${esc(d.keyVerseReference)}</cite></blockquote><p>Read the Scripture, full reflection, key takeaways, and sources in the accompanying devotion.</p><div class="btns"><a class="btn indigo" href="../${route(d)}">Read the devotion</a>${d.videos.filter(x=>x.id!==v.id).map(x=>`<a class="btn wine" href="${path.basename(videoRoute(d,x))}">Watch the ${x.kind==='short'?'Short':'full film'}</a>`).join('')}</div></section><nav class="topic-chips" aria-label="Related topics">${chips(d,'../')}</nav>${followPanel('../')}</main>`;
 set(file,shell(file,`${v.title} | ${v.kind==='short'?'Bible Short':'Bible Film'}`,desc,body,schemas));
}
set('follow.html',shell('follow.html','Follow Daily Devotions | A New Beginning','Make time for daily Bible reflection. Bookmark A New Beginning, follow new devotions in a feed reader, and visit I Can Still Believe on YouTube.',hero('Keep a little space for Scripture','Choose a simple way to return for new devotions and Bible story videos.')+`<main class="wrap narrow" id="main"><section class="info-section"><h2>Bookmark the daily devotions</h2><p>Save the <a href="index.html">devotions homepage</a> in your browser’s bookmarks. The latest devotion appears at the top, with a link to its video.</p><p>On a computer, use Ctrl+D (Windows) or Command+D (Mac). On a phone, open your browser’s menu and choose its bookmark option.</p></section><section class="info-section"><h2>Follow new readings</h2><p>A feed reader brings new posts from websites you follow into one place. Add this feed address to your reader to receive new devotion entries:</p><p><a class="feed-url" href="feed.xml">${siteUrl}feed.xml</a></p><p>Each entry links to the devotion and its accompanying video.</p></section><section class="info-section"><h2>Follow the Bible stories on YouTube</h2><p>Visit I Can Still Believe to watch the Shorts and full films. You can subscribe and choose notifications on YouTube.</p><a class="btn wine" href="${youtubeChannel}" target="_blank" rel="noopener">Visit I Can Still Believe</a></section><section class="info-section"><h2>Share encouragement</h2><p>Each devotion has a share button. Send a reading to someone it may encourage, and include a personal word about why it made you think of them.</p><a href="${route(latest)}">Read the latest devotion</a></section></main>`,[{'@type':'WebPage',name:'Follow Daily Devotions',url:absolute('follow.html')}]));
set('about.html',shell('about.html','About A New Beginning | Daily Christian Devotions','Bible devotions prepared by Dr. Davies Rene Segera, with Scripture, reflections alongside Ellen G. White’s writings, and I Can Still Believe videos.',hero('About A New Beginning','Daily devotions for thoughtful reading, practical faith, and encouragement in Christ.')+`<main class="wrap narrow" id="main"><section class="info-section"><h2>Scripture and everyday faith</h2><p>A New Beginning brings together Bible accounts, reflections on their meaning, and practical takeaways. These devotions are prepared by ${esc(author)} for a broad Christian audience worldwide.</p><p>Each reading invites you to consider the biblical account in its context and reflect on how it speaks to your life. The accompanying videos are published on <a href="${youtubeChannel}" target="_blank" rel="noopener">I Can Still Believe</a>.</p></section><section class="info-section"><h2>Sources you can follow</h2><p>Scripture quotations are from the <em>Holy Bible, New Living Translation</em>. The reflections also draw on the writings of Ellen G. White, a Christian author associated with the Seventh-day Adventist tradition. Her quotations are identified separately and cited to book, page, and paragraph.</p><p>Each devotion includes sources and further reading so you can explore the passages and quotations for yourself.</p></section><section class="info-section" id="author"><h2>Prepared by ${esc(author)}</h2><p>Free to read, and free to share with anyone.</p><div class="btns"><a class="btn indigo" href="index.html">Read the devotions</a><a class="btn ghost" href="topics.html">Explore a topic</a></div></section><div class="sdg">Soli Deo Gloria</div></main>`,[authorSchema,{'@type':'AboutPage',name:'About A New Beginning',url:absolute('about.html'),mainEntity:authorSchema}]));
// No synthetic publication dates or lastmod values: rebuilding is not republishing.
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...outputs.keys()].filter(f=>f.endsWith('.html')).map(f=>`<url><loc>${esc(absolute(f))}</loc></url>`).join('\n')}\n</urlset>`;
set('sitemap.xml',sitemap);
set('video-sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${allVideos.map(({d,v})=>`<url><loc>${absolute(videoRoute(d,v))}</loc><video:video><video:thumbnail_loc>https://i.ytimg.com/vi/${v.id}/hqdefault.jpg</video:thumbnail_loc><video:title>${esc(v.title)}</video:title><video:description>${esc(`${v.kind==='short'?'A short Bible reflection':'A Bible story film'} on ${d.passage}. ${d.summary}`)}</video:description><video:player_loc>https://www.youtube-nocookie.com/embed/${v.id}</video:player_loc>${v.uploadDate?`<video:publication_date>${v.uploadDate}</video:publication_date>`:''}</video:video></url>`).join('\n')}\n</urlset>`);
const feedOrder=[latest,...devotions.filter(d=>d!==latest).sort((a,b)=>(b.publishedDate||'').localeCompare(a.publishedDate||''))];
set('feed.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>A New Beginning — Daily Devotions</title><link>${siteUrl}</link><description>${esc(homeDescription)}</description><language>en</language><atom:link href="${siteUrl}feed.xml" rel="self" type="application/rss+xml"/>${feedOrder.map(d=>`<item><title>${esc(d.title)}</title><link>${absolute(route(d))}</link><guid isPermaLink="true">${absolute(route(d))}</guid><description>${esc(`<p>${esc(d.summary)}</p><p><a href="${absolute(route(d))}">Read the devotion</a>${d.videos.length?` · <a href="${absolute(videoRoute(d,d.videos[0]))}">Watch the Short</a>`:''}</p>`)}</description></item>`).join('\n')}</channel></rss>`);
const unknownFiles=fs.readdirSync(root).filter(f=>f.endsWith('.html')&&!outputs.has(f));
if(unknownFiles.length)throw Error('Add new devotion pages to devotions.json before updating: '+unknownFiles.join(', '));
const changed=[];
for(const [file,content] of outputs) {
 const dest=path.join(root,file);
 if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==content){changed.push(file);if(!checkOnly){fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,content);}}
}
if(checkOnly&&changed.length){console.error('Generated pages need updating: '+changed.join(', '));process.exitCode=1;}
else console.log(`${checkOnly?'Verified':'Updated'} ${devotions.length} devotions, ${allVideos.length} watch pages, ${topics.length} topic collections, sitemaps and feed. ${changed.length} files changed.`);
