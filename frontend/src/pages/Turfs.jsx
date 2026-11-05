import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import MapView from '../components/MapView';
import TurfCard from '../components/TurfCard';
import { Empty, Loader, PageHero } from '../components/ui';

export default function Turfs() {
  const [params, setParams] = useSearchParams();
  const [meta, setMeta] = useState({ districts: [], sports: [], amenities: [] });
  const [turfs, setTurfs] = useState(null);
  const [view, setView] = useState('split'); // split | list | map
  const [hover, setHover] = useState(null);
  const [geoNote, setGeoNote] = useState('');
  const [q, setQ] = useState(params.get('q') || '');

  const get = (k, d = '') => params.get(k) || d;
  const amenitySel = useMemo(() => get('amenities').split(',').filter(Boolean), [params]); // eslint-disable-line

  const setParam = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === '' || v == null ? next.delete(k) : next.set(k, v)));
    setParams(next, { replace: true });
  };

  useEffect(() => {
    api.get('/meta/').then((r) => setMeta(r.data)).catch(() => {});
  }, []);

  // Debounce the free-text search so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => q !== get('q') && setParam({ q }), 350);
    return () => clearTimeout(t);
  }, [q]); // eslint-disable-line

  useEffect(() => {
    setTurfs(null);
    api.get('/turfs/', { params: Object.fromEntries(params) })
      .then((r) => setTurfs(r.data))
      .catch(() => setTurfs([]));
  }, [params]);

  const nearMe = () => {
    if (!navigator.geolocation) return setGeoNote('Location is not supported by your browser.');
    setGeoNote('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGeoNote('');
        setParam({ lat: p.coords.latitude.toFixed(5), lng: p.coords.longitude.toFixed(5), sort: 'near' });
      },
      () => setGeoNote('Could not get your location. Allow access in the browser and try again.')
    );
  };

  const clear = () => { setQ(''); setParams({}); };
  const toggleAmenity = (a) => {
    const set = new Set(amenitySel);
    set.has(a) ? set.delete(a) : set.add(a);
    setParam({ amenities: [...set].join(',') });
  };
  const hasGeo = get('lat') && get('lng');

  return (
    <>
      <PageHero title="Find a turf" crumb="Turfs" subtitle="Filter by sport, district, price and amenities, then book a live slot." />
      <div className="container listing">
        <aside className="card filters">
          <h3>Filters <button onClick={clear}>Reset</button></h3>
          <div className="field">
            <label className="f" htmlFor="q">Search</label>
            <input id="q" type="search" placeholder="Name or area" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="field">
            <label className="f" htmlFor="sport">Sport</label>
            <select id="sport" value={get('sport')} onChange={(e) => setParam({ sport: e.target.value })}>
              <option value="">All sports</option>
              {meta.sports.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="f" htmlFor="district">District</label>
            <select id="district" value={get('district')} onChange={(e) => setParam({ district: e.target.value })}>
              <option value="">All Kerala</option>
              {meta.districts.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="f">Price per hour (₹)</label>
            <div className="row" style={{ gap: '.5rem' }}>
              <input type="number" min="0" step="100" placeholder="Min" value={get('min_price')} onChange={(e) => setParam({ min_price: e.target.value })} />
              <input type="number" min="0" step="100" placeholder="Max" value={get('max_price')} onChange={(e) => setParam({ max_price: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label className="f">Amenities</label>
            {meta.amenities.map((a) => (
              <label className="check" key={a}>
                <input type="checkbox" checked={amenitySel.includes(a)} onChange={() => toggleAmenity(a)} /> {a}
              </label>
            ))}
          </div>
          <button className="btn btn-outline btn-block btn-sm" onClick={nearMe}>⌖ Turfs near me</button>
          {geoNote && <div className="help">{geoNote}</div>}
        </aside>

        <section>
          <div className="results-head">
            <div>
              <strong>{turfs ? turfs.length : '…'}</strong> turf{turfs?.length === 1 ? '' : 's'} found
              {hasGeo && <span className="badge soft" style={{ marginLeft: '.6rem' }}>Sorted by distance</span>}
            </div>
            <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select aria-label="Sort" value={get('sort', 'rating')} onChange={(e) => setParam({ sort: e.target.value })} style={{ width: 'auto' }}>
                <option value="rating">Top rated</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                {hasGeo && <option value="near">Nearest first</option>}
              </select>
              <div className="seg" style={{ gridTemplateColumns: 'repeat(3, auto)' }}>
                {['split', 'list', 'map'].map((v) => (
                  <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)} style={{ padding: '.45rem .8rem' }}>
                    {v[0].toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {turfs === null ? <Loader /> : turfs.length === 0 ? (
            <Empty title="No turfs match those filters">
              Try widening the price range or <button className="btn btn-sm btn-outline" onClick={clear}>reset all filters</button>
            </Empty>
          ) : view === 'map' ? (
            <MapView turfs={turfs} height={620} scrollWheel />
          ) : (
            <div className={view === 'split' ? 'split' : ''}>
              <div className="grid" style={{ gridTemplateColumns: view === 'split' ? '1fr' : 'repeat(auto-fill, minmax(290px, 1fr))' }}>
                {turfs.map((t) => <TurfCard key={t.slug} turf={t} onHover={setHover} />)}
              </div>
              {view === 'split' && (
                <div className="map-col"><MapView turfs={turfs} height={640} activeSlug={hover} scrollWheel /></div>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
