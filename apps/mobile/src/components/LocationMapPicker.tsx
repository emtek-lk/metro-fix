import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Text } from './ui/AppText';
import { Icon } from './ui/Icon';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing, radius } from '../theme/layout';
import { themedStyles } from '../theme/themedStyles';
import { buildMapHtml, parseMapMessage } from '../lib/mapHtml';

export interface PickedPoint {
  latitude: number;
  longitude: number;
}

interface PlaceResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationMapPickerProps {
  /** The pin, if one is placed. Changing it from outside (e.g. "use my location") moves the pin. */
  value: PickedPoint | null;
  onChange: (point: PickedPoint) => void;
  height?: number;
}

/** Uber-style site picker: tap the map or drag the pin, or search an address. */
export const LocationMapPicker: React.FC<LocationMapPickerProps> = ({ value, onChange, height = 260 }) => {
  const webRef = useRef<WebView>(null);
  const frameRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  // The page is built once with the starting pin; later moves go through messages.
  const html = useMemo(() => buildMapHtml(value), []); // eslint-disable-line react-hooks/exhaustive-deps
  const lastSent = useRef<PickedPoint | null>(value);

  const handleRaw = useCallback(
    (raw: unknown) => {
      const message = parseMapMessage(raw);
      if (!message) return;
      if (message.type === 'ready') setReady(true);
      else if (message.type === 'error') setMapError(message.message);
      else {
        lastSent.current = { latitude: message.latitude, longitude: message.longitude };
        onChange({ latitude: message.latitude, longitude: message.longitude });
      }
    },
    [onChange],
  );

  // On web the page lives in an iframe and talks through window messages.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const browser = globalThis as any;
    const listener = (event: { data: unknown }) => handleRaw(event.data);
    browser.addEventListener('message', listener);
    return () => browser.removeEventListener('message', listener);
  }, [handleRaw]);

  const sendPin = useCallback((point: PickedPoint) => {
    const payload = JSON.stringify({ type: 'setPin', ...point });
    if (Platform.OS === 'web') frameRef.current?.contentWindow?.postMessage(payload, '*');
    else webRef.current?.injectJavaScript(`window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(payload)}}));true;`);
  }, []);

  // Move the pin when the value changes from outside (not when it came from the map itself).
  useEffect(() => {
    if (!ready || !value) return;
    const last = lastSent.current;
    if (last && Math.abs(last.latitude - value.latitude) < 1e-7 && Math.abs(last.longitude - value.longitude) < 1e-7) return;
    lastSent.current = value;
    sendPin(value);
  }, [value, ready, sendPin]);

  const search = async () => {
    const text = query.trim();
    if (text.length < 3) return;
    setSearching(true);
    setNote(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(text)}`,
        { headers: { Accept: 'application/json', 'User-Agent': 'METRO-FIX-mobile' } },
      );
      const data = (await response.json()) as PlaceResult[];
      setResults(data);
      if (data.length === 0) setNote('No places found. Try a nearby landmark, or tap the map.');
    } catch {
      setNote('Address search is unavailable right now. Tap the map to place the pin.');
    } finally {
      setSearching(false);
    }
  };

  const choose = (result: PlaceResult) => {
    const point = { latitude: Number(result.lat), longitude: Number(result.lon) };
    lastSent.current = point;
    sendPin(point);
    onChange(point);
    setResults([]);
    setQuery(result.display_name);
  };

  return (
    <View>
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Icon name="search" size={15} color={colors.textMuted} />
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search an address or place"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={search}
            accessibilityLabel="Search an address or place"
            autoCorrect={false}
          />
          {searching ? <ActivityIndicator size="small" color={colors.brand} /> : null}
        </View>
      </View>
      {results.length > 0 && (
        <View style={s.results}>
          {results.map((result) => (
            <Pressable
              key={`${result.lat},${result.lon}`}
              onPress={() => choose(result)}
              style={s.result}
              accessibilityRole="button"
              accessibilityLabel={`Use ${result.display_name}`}
            >
              <Icon name="map-pin" size={14} color={colors.brand} />
              <Text style={s.resultText} numberOfLines={2}>{result.display_name}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {note ? <Text style={s.note}>{note}</Text> : null}

      <View style={[s.map, { height }]}>
        {mapError ? (
          <View style={s.mapError}><Text style={s.note}>{mapError}</Text></View>
        ) : Platform.OS === 'web' ? (
          React.createElement('iframe', {
            ref: frameRef,
            srcDoc: html,
            title: 'Map',
            style: { border: 0, width: '100%', height: '100%' },
          })
        ) : (
          <WebView
            ref={webRef}
            originWhitelist={['*']}
            source={{ html, baseUrl: 'https://metro-fix.local' }}
            onMessage={(event: WebViewMessageEvent) => handleRaw(event.nativeEvent.data)}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            nestedScrollEnabled
            overScrollMode="never"
            style={s.web}
          />
        )}
      </View>
      <Text style={s.hint}>
        {value
          ? 'Drag the pin or tap the map to fine-tune the exact spot.'
          : 'Tap the map to drop a pin on the site.'}
      </Text>
    </View>
  );
};

const s = themedStyles(() => StyleSheet.create({
  searchRow: { marginBottom: spacing.sm },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  searchInput: { flex: 1, paddingVertical: spacing.md, color: colors.text, ...typography.body },
  results: { marginBottom: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' },
  result: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  resultText: { flex: 1, ...typography.caption, color: colors.text },
  note: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  map: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  web: { flex: 1, backgroundColor: 'transparent' },
  mapError: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
}));
