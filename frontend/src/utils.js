export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export const toISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const todayISO = () => toISODate(new Date());

export const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toISODate(d);
};

export const fmtDate = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const hourLabel = (h) => `${h % 12 || 12}:00 ${h % 24 < 12 ? 'AM' : 'PM'}`;

export const SPORTS = {
  football: { label: 'Football', tag: '7-a-side & 5-a-side', img: '/img/turfs/football-day.svg' },
  cricket: { label: 'Box Cricket', tag: 'Netted box arenas', img: '/img/turfs/cricket-day.svg' },
  badminton: { label: 'Badminton', tag: 'Indoor courts', img: '/img/turfs/badminton-day.svg' },
  basketball: { label: 'Basketball', tag: 'Full & half courts', img: '/img/turfs/basketball-day.svg' },
  multi: { label: 'Multi-sport', tag: 'Futsal & more', img: '/img/turfs/multi-day.svg' },
};

export const directionsUrl = (lat, lng) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

// Turn a DRF error response into one readable sentence.
export const errMsg = (e, fallback = 'Something went wrong. Please try again.') => {
  const d = e?.response?.data;
  if (!d) return e?.message === 'Network Error' ? 'Cannot reach the server. Is the Django API running?' : fallback;
  if (typeof d === 'string') return fallback;
  if (d.detail) return d.detail;
  const parts = Object.entries(d).map(([k, v]) => {
    const text = Array.isArray(v) ? v.join(' ') : String(v);
    return k === 'non_field_errors' ? text : `${k.replace(/_/g, ' ')}: ${text}`;
  });
  return parts.join(' · ') || fallback;
};
