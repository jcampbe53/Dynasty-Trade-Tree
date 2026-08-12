const CACHE="dynasty-trade-tree-v1.1.2";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png"];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)));
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("message",event=>{
 if(event.data&&event.data.type==="SKIP_WAITING")self.skipWaiting();
});
self.addEventListener("fetch",event=>{
 if(event.request.mode==="navigate"){
  event.respondWith(fetch(event.request).then(resp=>{
   const copy=resp.clone();caches.open(CACHE).then(c=>c.put("./index.html",copy));return resp;
  }).catch(()=>caches.match("./index.html")));
  return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(resp=>{
  const copy=resp.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));return resp;
 })));
});
