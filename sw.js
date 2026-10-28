const CACHE='appraiser-v1.5.0';
const CORE=['./','./index.html','./style.css','./character.css','./combat.css','./mobile.css','./screens.css','./formation.js','./opening.js','./app.js','./phaser-battle.js','./prototype/phaser/vendor/phaser-3.90.0.min.js','./prototype/phaser/battle-scene.js','./prototype/phaser/battle-model.js','./prototype/phaser/effects-lifecycle.js','./prototype/phaser/art-layout.js','./engine.js','./data.js','./character.js','./combat.js','./portraits.js','./display.js','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/key-art.webp'];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll(CORE);
 const response=await fetch('./assets/catalog.json');
 const assets=await response.json();
 // Small batches avoid exhausting mobile connection limits.
 for(let i=0;i<assets.length;i+=12)await cache.addAll(assets.slice(i,i+12));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{await Promise.all((await caches.keys()).filter(key=>key.startsWith('appraiser-')&&key!==CACHE).map(key=>caches.delete(key)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cached=await caches.match(event.request);
  const shell=event.request.mode==='navigate'||['script','style'].includes(event.request.destination);
  if(cached&&!shell)return cached;
  try{const response=await fetch(event.request);if(response.ok){const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());}return response;}catch(error){if(cached)return cached;if(event.request.mode==='navigate')return caches.match('./index.html');throw error;}
 })());
});
