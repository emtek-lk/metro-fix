/**
 * The page shown inside the location picker's WebView (or iframe on web): a Leaflet map on
 * OpenStreetMap tiles with one draggable pin. It reports the pin as `{ type: 'pick', latitude,
 * longitude }` and accepts `{ type: 'setPin', latitude, longitude }` to move it.
 */
export function buildMapHtml(initial: { latitude: number; longitude: number } | null, zoom = 15): string {
  const center = initial ?? { latitude: 6.9271, longitude: 79.8612 };
  const startZoom = initial ? zoom : 12;
  return `<!doctype html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;margin:0;padding:0;background:#e5e7eb}.leaflet-control-attribution{font-size:9px}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function () {
  var post = function (payload) {
    var text = JSON.stringify(payload);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
    else if (window.parent !== window) window.parent.postMessage(text, '*');
  };
  if (!window.L) { post({ type: 'error', message: 'The map could not be loaded. Check your internet connection.' }); return; }
  var map = L.map('map', { zoomControl: true }).setView([${center.latitude}, ${center.longitude}], ${startZoom});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);
  var marker = null;
  function put(lat, lng, pan, notify) {
    if (!marker) {
      marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on('dragend', function () { var p = marker.getLatLng(); post({ type: 'pick', latitude: p.lat, longitude: p.lng }); });
    } else { marker.setLatLng([lat, lng]); }
    if (pan) map.setView([lat, lng], Math.max(map.getZoom(), 16));
    if (notify) post({ type: 'pick', latitude: lat, longitude: lng });
  }
  map.on('click', function (e) { put(e.latlng.lat, e.latlng.lng, false, true); });
  ${initial ? `put(${initial.latitude}, ${initial.longitude}, false, false);` : ''}
  function onMessage(event) {
    try {
      var data = JSON.parse(event.data);
      if (data.type === 'setPin') put(data.latitude, data.longitude, true, false);
    } catch (e) {}
  }
  window.addEventListener('message', onMessage);
  document.addEventListener('message', onMessage);
  post({ type: 'ready' });
})();
</script></body></html>`;
}

export type MapMessage =
  | { type: 'ready' }
  | { type: 'error'; message: string }
  | { type: 'pick'; latitude: number; longitude: number };

/** Parses a message from the map page; anything unreadable is ignored. */
export function parseMapMessage(raw: unknown): MapMessage | null {
  if (typeof raw !== 'string') return null;
  try {
    const data = JSON.parse(raw);
    if (data?.type === 'ready') return { type: 'ready' };
    if (data?.type === 'error' && typeof data.message === 'string') return { type: 'error', message: data.message };
    if (data?.type === 'pick' && Number.isFinite(data.latitude) && Number.isFinite(data.longitude)) {
      return { type: 'pick', latitude: data.latitude, longitude: data.longitude };
    }
  } catch {
    // not ours
  }
  return null;
}
