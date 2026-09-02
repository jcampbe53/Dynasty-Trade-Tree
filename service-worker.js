const CACHE="dynasty-trade-tree-v1.9.0-notifications-foundation";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./apple-touch-icon.png","./push-config.js"];

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(CORE))
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("message",event=>{
  if(event.data&&event.data.type==="SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch",event=>{
  if(
    event.request.url.startsWith("https://api.sleeper.app/") ||
    event.request.url.startsWith("https://api.github.com/") ||
    event.request.url.startsWith("https://raw.githubusercontent.com/")
  ) return;

  if(event.request.mode==="navigate"){
    event.respondWith(
      fetch(event.request)
        .then(resp=>{
          const copy=resp.clone();
          caches.open(CACHE).then(c=>c.put("./index.html",copy));
          return resp;
        })
        .catch(()=>caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached=>
      cached || fetch(event.request).then(resp=>{
        const copy=resp.clone();
        caches.open(CACHE).then(c=>c.put(event.request,copy));
        return resp;
      })
    )
  );
});

self.addEventListener("push",event=>{
  let data={};

  try{
    data=event.data ? event.data.json() : {};
  }catch(e){
    data={};
  }

  const title=data.title || "Trade finalized";

  const options={
    body:data.body || "A new Sleeper trade has been finalized.",
    icon:"./icon-192.png",
    badge:"./icon-192.png",
    tag:data.tag || ("trade-"+(data.tradeId || Date.now())),
    renotify:true,
    data:{
      url:data.url || "./",
      tradeId:data.tradeId || null
    }
  };

  event.waitUntil(
    self.registration.showNotification(title,options)
  );
});

self.addEventListener("notificationclick",event=>{
  event.notification.close();

  const relative=
    (event.notification.data && event.notification.data.url) || "./";

  const target=
    new URL(relative,self.registration.scope).href;

  event.waitUntil((async()=>{
    const windows=
      await clients.matchAll({
        type:"window",
        includeUncontrolled:true
      });

    for(const client of windows){
      if("navigate" in client){
        try{
          await client.navigate(target);
        }catch(e){}

        return client.focus();
      }
    }

    return clients.openWindow(target);
  })());
});
