import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { pinIcon } from './MapView';

const KERALA_CENTER = [10.4, 76.3];

function ClickToPlace({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) map.setView([lat, lng], Math.max(map.getZoom(), 14));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

/**
 * Owner-side map: click or drag the pin to set the turf location. Includes a place search
 * (OpenStreetMap Nominatim, light personal use) and a "use my location" shortcut.
 */
export default function LocationPicker({ lat, lng, onChange }) {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const hasPoint = lat !== '' && lng !== '' && lat != null && lng != null;
  const set = (a, b) => onChange(Number(a.toFixed(6)), Number(b.toFixed(6)));

  const search = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setNote('');
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(query + ', Kerala')}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data[0]) set(parseFloat(data[0].lat), parseFloat(data[0].lon));
      else setNote('No match found. Try a nearby landmark or click the map.');
    } catch {
      setNote('Search is unavailable right now. Click the map to place the pin.');
    } finally {
      setBusy(false);
    }
  };

  const locate = () => {
    if (!navigator.geolocation) return setNote('Location is not supported by this browser.');
    navigator.geolocation.getCurrentPosition(
      (p) => set(p.coords.latitude, p.coords.longitude),
      () => setNote('Could not read your location. Please allow access or click the map.')
    );
  };

  return (
    <div>
      <form onSubmit={search} style={{ display: 'flex', gap: '.5rem', marginBottom: '.6rem', flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="Search a place in Kerala, e.g. Kakkanad"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: '1 1 200px' }}
        />
        <button className="btn btn-green btn-sm" disabled={busy}>{busy ? 'Searching…' : 'Search'}</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={locate}>Use my location</button>
      </form>
      {note && <div className="alert info">{note}</div>}
      <MapContainer
        center={hasPoint ? [Number(lat), Number(lng)] : KERALA_CENTER}
        zoom={hasPoint ? 14 : 7}
        scrollWheelZoom
        className="map"
        style={{ height: 340 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToPlace onPick={set} />
        <Recenter lat={hasPoint ? Number(lat) : null} lng={hasPoint ? Number(lng) : null} />
        {hasPoint && (
          <Marker
            position={[Number(lat), Number(lng)]}
            icon={pinIcon(true)}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const p = e.target.getLatLng();
                set(p.lat, p.lng);
              },
            }}
          />
        )}
      </MapContainer>
      <div className="help">
        Click the map or drag the pin to the turf entrance.
        {hasPoint && <> Selected: {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}</>}
      </div>
    </div>
  );
}
