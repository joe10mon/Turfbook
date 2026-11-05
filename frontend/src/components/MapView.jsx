import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { inr } from '../utils';

const KERALA_CENTER = [10.4, 76.3];

// A custom CSS pin avoids Leaflet's default marker images, which bundlers often fail to resolve.
export const pinIcon = (active = false) =>
  L.divIcon({
    className: 'tb-pin',
    html: `<span class="${active ? 'on' : ''}"></span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -32],
  });

function FitBounds({ points }) {
  const map = useMap();
  const key = JSON.stringify(points);
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [40, 40], maxZoom: 13 });
    else if (points.length === 1) map.setView(points[0], 14);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

/** Shows many turfs (popup cards) or a single one (pass a one-item array). */
export default function MapView({ turfs, height = 420, activeSlug, scrollWheel = false, popups = true }) {
  const points = turfs.map((t) => [Number(t.latitude), Number(t.longitude)]);
  return (
    <MapContainer
      center={KERALA_CENTER}
      zoom={7}
      scrollWheelZoom={scrollWheel}
      className="map"
      style={{ height }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      {turfs.map((t) => (
        <Marker
          key={t.slug}
          position={[Number(t.latitude), Number(t.longitude)]}
          icon={pinIcon(t.slug === activeSlug)}
        >
          {popups && (
            <Popup>
              <div className="pop">
                <img src={t.images?.[0]} alt="" />
                <b>{t.name}</b>
                <div className="muted" style={{ fontSize: '.8rem' }}>{t.district}</div>
                <div style={{ margin: '.3rem 0 .5rem' }}>
                  <strong>{inr(t.price_per_hour)}</strong> <span className="muted">/ hour</span>
                </div>
                <Link className="btn btn-green btn-sm" to={`/turfs/${t.slug}`}>View &amp; book</Link>
              </div>
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}
