/* Business Cool v2.2 – VK startup handshake.
   Loads the official VK Bridge without blocking the catalogue.
   A minimal postMessage handshake is used while remote script is loading.
   This is not a substitute for the official Bridge API on other operations. */
(function(){
  'use strict';
  const isEmbedded = window.parent !== window;
  const ref = document.referrer || '';
  const fromVK = isEmbedded || /(?:^|[?&])vk_app_id=/.test(location.search) || /(?:^|[?&])vk_platform=/.test(location.search) || /^https?:\/\/(?:[^/]+\.)?vk\.(?:ru|com)\//i.test(ref);
  if (!fromVK) return;
  let frameId;
  let connected = false;
  const version = '2.15.0';
  function handshake() {
    if (!isEmbedded) return;
    try {
      const payload = {handler:'VKWebAppInit',params:{},type:'vk-connect',connectVersion:version};
      if (frameId !== undefined) payload.webFrameId = frameId;
      window.parent.postMessage(payload, '*');
    } catch (e) { console.warn('VK handshake:', e); }
  }
  window.addEventListener('message', function(event){
    if (event.source !== window.parent) return;
    let payload = event.data;
    if (typeof payload === 'string') { try {payload=JSON.parse(payload);} catch(e){return;} }
    if (!payload || typeof payload !== 'object') return;
    if (payload.type === 'VKWebAppSettings') {
      frameId = payload.frameId;
      handshake();
    }
  });
  function officialInit() {
    if (connected || !window.vkBridge || typeof window.vkBridge.send !== 'function') return;
    connected = true;
    window.vkBridge.send('VKWebAppInit').catch(function(e){
      console.warn('VK Bridge init was not acknowledged:', e);
    });
  }
  // Do not depend on an external CDN to paint the page or send the first handshake.
  handshake();
  setTimeout(handshake, 400);
  setTimeout(handshake, 1500);
  if (window.vkBridge) { officialInit(); return; }
  const sources = [
    'https://unpkg.com/@vkontakte/vk-bridge@2.15.0/dist/browser.min.js',
    'https://cdn.jsdelivr.net/npm/@vkontakte/vk-bridge@2.15.0/dist/browser.min.js'
  ];
  function load(i){
    if (i>=sources.length) {console.warn('VK Bridge CDN unavailable; native startup handshake attempted');return;}
    const script = document.createElement('script');
    script.async = true;
    script.src = sources[i];
    script.onload = officialInit;
    script.onerror = function(){load(i+1);};
    document.head.appendChild(script);
  }
  load(0);
})();
