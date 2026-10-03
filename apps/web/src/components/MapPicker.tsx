import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

export interface PickedLocation {
  latitude: number;
  longitude: number;
}

interface MapPickerProps {
  value: PickedLocation | null;
  onChange: (location: PickedLocation, label?: string) => void;
  height?: number;
}

interface PlaceResult {
  display_name: string;
  lat: string;
  lon: string;
}

// Colombo, the default centre when nothing is picked yet.
const DEFAULT_CENTER: PickedLocation = { latitude: 6.9271, longitude: 79.8612 };
const LEAFLET_VERSION = '1.9.4';

let leafletPromise: Promise<any> | null = null;

/** Loads Leaflet (maps by OpenStreetMap) once, on first use, so it costs nothing on other pages. */
function loadLeaflet(): Promise<any> {
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
    script.onload = () => resolve((window as any).L);
    script.onerror = () => {
      leafletPromise = null;
      reject(new Error('The map could not be loaded. Check the internet connection.'));
    };
    document.body.appendChild(script);
  });
  return leafletPromise;
}

/** Uber-style location picker: tap the map or drag the pin, search an address, or use your location. */
export function MapPicker({ value, onChange, height = 280 }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchNote, setSearchNote] = useState<string | null>(null);

  const place = useCallback((latitude: number, longitude: number, label?: string, pan = false) => {
    const map = mapRef.current;
    const L = (window as any).L;
    if (!map || !L) return;
    if (!markerRef.current) {
      markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const at = markerRef.current.getLatLng();
        onChangeRef.current({ latitude: at.lat, longitude: at.lng });
      });
    } else {
      markerRef.current.setLatLng([latitude, longitude]);
    }
    if (pan) map.setView([latitude, longitude], Math.max(map.getZoom(), 16));
    onChangeRef.current({ latitude, longitude }, label);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const start = value ?? DEFAULT_CENTER;
        const map = L.map(containerRef.current).setView([start.latitude, start.longitude], value ? 16 : 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }).addTo(map);
        map.on('click', (event: any) => place(event.latlng.lat, event.latlng.lng));
        mapRef.current = map;
        if (value) place(value.latitude, value.longitude);
        // The container may have just appeared inside a modal; make Leaflet measure it again.
        setTimeout(() => map.invalidateSize(), 50);
      })
      .catch((error: Error) => setLoadError(error.message));
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // The map is created once; later value changes only move the pin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (value && mapRef.current) {
      const current = markerRef.current?.getLatLng();
      if (!current || Math.abs(current.lat - value.latitude) > 1e-7 || Math.abs(current.lng - value.longitude) > 1e-7) {
        if (!markerRef.current) place(value.latitude, value.longitude);
        else markerRef.current.setLatLng([value.latitude, value.longitude]);
        mapRef.current.setView([value.latitude, value.longitude], Math.max(mapRef.current.getZoom(), 15));
      }
    }
  }, [value, place]);

  const search = async () => {
    const text = query.trim();
    if (text.length < 3) return;
    setSearching(true);
    setSearchNote(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(text)}`,
        { headers: { Accept: 'application/json' } },
      );
      const data = (await response.json()) as PlaceResult[];
      setResults(data);
      if (data.length === 0) setSearchNote('No places found. Try a nearby landmark or drop the pin by hand.');
    } catch {
      setSearchNote('Address search is unavailable right now. Drop the pin on the map instead.');
    } finally {
      setSearching(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setSearchNote('This browser cannot share a location.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => place(position.coords.latitude, position.coords.longitude, 'My location', true),
      () => setSearchNote('Location permission was denied. Drop the pin on the map instead.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div>
      <div style={styles.searchRow}>
        <input
          type="search"
          value={query}
          placeholder="Search an address or place…"
          aria-label="Search an address or place"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void search();
            }
          }}
          style={styles.input}
        />
        <button type="button" onClick={() => void search()} disabled={searching} style={styles.secondary}>
          {searching ? 'Searching…' : 'Search'}
        </button>
        <button type="button" onClick={useMyLocation} style={styles.secondary} title="Use this device's location">
          My location
        </button>
      </div>
      {results.length > 0 && (
        <ul style={styles.results} aria-label="Search results">
          {results.map((result) => (
            <li key={`${result.lat},${result.lon}`}>
              <button
                type="button"
                style={styles.result}
                onClick={() => {
                  place(Number(result.lat), Number(result.lon), result.display_name, true);
                  setResults([]);
                  setQuery(result.display_name);
                }}
              >
                {result.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {searchNote && <div style={styles.note}>{searchNote}</div>}
      {loadError ? (
        <div style={{ ...styles.map, ...styles.mapError, height }}>{loadError}</div>
      ) : (
        <div ref={containerRef} style={{ ...styles.map, height }} role="application" aria-label="Map: tap to place the pin" />
      )}
      <div style={styles.hint}>
        {value
          ? `Pin at ${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}. Drag it or tap elsewhere to move it.`
          : 'Tap the map to drop a pin on the site.'}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  searchRow: { display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  input: {
    flex: '1 1 180px',
    minWidth: 0,
    padding: '9px 12px',
    borderRadius: 10,
    border: '1px solid var(--border-subtle)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    fontSize: '0.88rem',
  },
  secondary: {
    padding: '9px 12px',
    borderRadius: 10,
    border: '1px solid rgba(243, 136, 8, 0.55)',
    background: 'transparent',
    color: '#f38808',
    fontWeight: 600,
    fontSize: '0.84rem',
    cursor: 'pointer',
  },
  results: {
    listStyle: 'none',
    margin: '0 0 8px',
    padding: 0,
    border: '1px solid var(--border-subtle)',
    borderRadius: 10,
    background: 'var(--surface)',
    maxHeight: 150,
    overflowY: 'auto',
  },
  result: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 12px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: '0.82rem',
    cursor: 'pointer',
  },
  note: { color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 8 },
  map: { width: '100%', borderRadius: 12, border: '1px solid var(--border-subtle)', overflow: 'hidden', zIndex: 0 },
  mapError: { display: 'grid', placeItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: 16, textAlign: 'center' },
  hint: { color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: 6 },
};
