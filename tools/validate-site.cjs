// Site-wide checks using Node.js only. Run after update-site.cjs.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const config=JSON.parse(fs.readFileSync(path.join(root,'devotions.json'),'utf8'));
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const decode=s=>s.replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const files=[];
function walk(dir){for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const name=path.posix.join(dir,entry.name);if(entry.isDirectory()){if(!['node_modules','.git'].includes(entry.name))walk(name);}else if(name.endsWith('.html'))files.push(name);}}
walk('');
const titles=new Set(), descriptions=new Set();
let links=0, videos=0;
for(const file of files){
 const html=read(file);
 assert.equal((html.match(/<h1\b/g)||[]).length,1,`${file}: one h1`);
 assert.equal((html.match(/<main\b/g)||[]).length,1,`${file}: one main`);
 assert.match(html,/<html lang="en">/);
 const title=html.match(/<title>([\s\S]*?)<\/title>/)?.[1];
 const description=html.match(/<meta name="description" content="([^"]+)"/)?.[1];
 assert(title&&!titles.has(title),`${file}: unique title`);titles.add(title);
 assert(description&&!descriptions.has(description),`${file}: unique description`);descriptions.add(description);
 const canonical=[...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
 assert.equal(canonical.length,1,`${file}: one canonical`);
 assert.equal(canonical[0][1],config.siteUrl+(file==='index.html'?'':file));
 assert(!/noindex|localhost|127\.0\.0\.1|file:\/\//i.test(html),`${file}: no local or noindex URLs`);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length,`${file}: unique IDs`);
 for(const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
  const data=JSON.parse(match[1]);assert.equal(data['@context'],'https://schema.org');
  for(const item of data['@graph'])if(item['@type']==='VideoObject'){
   videos++;
   for(const key of ['name','thumbnailUrl','uploadDate','embedUrl'])assert(item[key],`${file}: VideoObject ${key}`);
   assert(item.embedUrl.includes('youtube-nocookie.com/embed/'));
  }
 }
 for(const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
  const value=decode(m[1]);
  const resolved=new URL(value,'https://local.invalid/'+file);
  if(resolved.origin!=='https://local.invalid')continue;
  const target=decodeURIComponent(resolved.pathname).slice(1)||'index.html';
  const targetFile=target.endsWith('/')?target+'index.html':target;
  assert(fs.existsSync(path.join(root,targetFile)),`${file}: missing ${value}`);
  if(resolved.hash&&targetFile.endsWith('.html'))assert(read(targetFile).includes(`id="${decodeURIComponent(resolved.hash.slice(1))}"`),`${file}: missing anchor ${value}`);
  links++;
 }
 for(const m of html.matchAll(/<iframe\b[^>]*>/g)){
  assert(/title="[^"]+"/.test(m[0]));assert(/width="\d+"/.test(m[0])&&/height="\d+"/.test(m[0]));
  assert(!m[0].includes('autoplay=1'),`${file}: no autoplay`);
 }
 if(file.startsWith('watch/')){
  const frames=[...html.matchAll(/<iframe\b[^>]*>/g)];assert.equal(frames.length,1,`${file}: one primary video`);
  assert(!/loading="lazy"|srcdoc=|data-src=/.test(frames[0][0]),`${file}: video available without interaction`);
 }
}
const sitemap=read('sitemap.xml');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>decode(m[1]));
assert.equal(urls.length,files.length);assert.equal(new Set(urls).size,files.length);
for(const f of files)assert(urls.includes(config.siteUrl+(f==='index.html'?'':f)),`Sitemap missing ${f}`);
const vs=read('video-sitemap.xml');
assert.equal((vs.match(/<video:video>/g)||[]).length,config.devotions.reduce((n,d)=>n+d.videos.length,0));
assert.equal((read('feed.xml').match(/<item>/g)||[]).length,config.devotions.length);
for(const asset of ['assets/site.js','assets/theme.js'])new vm.Script(read(asset),{filename:asset});
execFileSync(process.execPath,[path.join(__dirname,'update-site.cjs'),'--check'],{stdio:'inherit'});
console.log(`Passed: ${files.length} pages, ${links} local links/assets, ${videos} complete video schemas, all sitemap/feed entries, JavaScript syntax, and repeatable generation.`);
