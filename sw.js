const CACHE='epoch-mobile-v3';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('epoch-mobile-')&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 const r=event.request,u=new URL(r.url);if(r.method!=='GET'||u.origin!==self.location.origin)return;
 // Only cache the game's own static files. Never cache sign-in or API responses.
 const isNav=r.mode==='navigate'&&(u.pathname==='/'||u.pathname==='/index.html');
 const isAsset=/\/(?:assets\/[^/]+\.(?:png|svg)|(?:style\.css|game\.js|textures\.js|worldfx\.js|mobile\.js|manifest\.webmanifest))$/.test(u.pathname);
 if(!isNav&&!isAsset)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(r);if(response.ok&&!response.redirected){if(isNav){const body=await response.clone().text();if(body.includes('id="hubScreen"')&&body.includes('EPOCH Blocks'))await cache.put(r,response.clone())}else await cache.put(r,response.clone())}return response}catch{const saved=await cache.match(r);if(saved)return saved;return new Response('Mở game có mạng một lần để tải nội dung này.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})}})());
});
