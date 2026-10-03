import { buildMapHtml, parseMapMessage } from '../src/lib/mapHtml';
// Node built-ins are not typed in the app's tsconfig; this test only runs under Jest (Node).
const nodeRequire: any = require;
const fs = nodeRequire('fs');
const path = nodeRequire('path');
import { LEAFLET_CSS, LEAFLET_JS, LEAFLET_VERSION } from '../src/vendor/leafletBundle';

describe('map page', () => {
  it('ships Leaflet inside the page instead of downloading it', () => {
    const html = buildMapHtml({ latitude: 6.9, longitude: 79.86 });
    expect(html).not.toMatch(/unpkg|cdn\./i);
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).toContain(LEAFLET_JS.slice(0, 200));
    expect(html).toContain('.leaflet-container');
    expect(html).toContain('6.9, 79.86');
  });

  it('starts on Colombo, zoomed out, when nothing is picked yet', () => {
    expect(buildMapHtml(null)).toContain('setView([6.9271, 79.8612], 12)');
  });

  it('keeps the bundled Leaflet in step with the installed package', () => {
    const dist = path.dirname(nodeRequire.resolve('leaflet/dist/leaflet.js'));
    const installed = JSON.parse(fs.readFileSync(path.join(dist, '..', 'package.json'), 'utf8')).version;
    expect(LEAFLET_VERSION).toBe(installed);
    expect(LEAFLET_CSS).toBe(fs.readFileSync(path.join(dist, 'leaflet.css'), 'utf8'));
    // If this fails, run: npm run build:leaflet --workspace apps/mobile
    expect(LEAFLET_JS.length).toBeGreaterThan(100000);
  });
});

describe('map messages', () => {
  it('reads the messages the page sends and ignores everything else', () => {
    expect(parseMapMessage(JSON.stringify({ type: 'pick', latitude: 6.9, longitude: 79.8 }))).toEqual({ type: 'pick', latitude: 6.9, longitude: 79.8 });
    expect(parseMapMessage(JSON.stringify({ type: 'ready' }))).toEqual({ type: 'ready' });
    expect(parseMapMessage(JSON.stringify({ type: 'pick', latitude: 'x' }))).toBeNull();
    expect(parseMapMessage('not json')).toBeNull();
    expect(parseMapMessage(42)).toBeNull();
  });
});
