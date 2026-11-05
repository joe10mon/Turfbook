import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import MapView from '../components/MapView';
import TurfCard from '../components/TurfCard';
import { Loader, SectionTitle } from '../components/ui';
import { SPORTS } from '../utils';

const STEPS = [
  ['Find your ground', 'Search by district, sport or price, or tap a pin on the Kerala map to see what is near you.'],
  ['Choose your hour', 'See live availability for the next 60 days. Select one or more consecutive hours.'],
  ['Pay & play', 'Confirm instantly and get a booking code. Show it at the gate and kick off.'],
];

const FEATURES = [
  ['⌖', 'Map-first search', 'Every turf is pinned on OpenStreetMap with one-tap directions.'],
  ['◷', 'Live slot availability', 'No phone calls. Booked and past slots are greyed out in real time.'],
  ['₹', 'Honest pricing', 'Weekday and weekend rates shown up front. No hidden platform fee.'],
  ['✓', 'Free cancellation window', 'Cancel up to 2 hours before kick-off and get your money back.'],
];

export default function Home() {
  const navigate = useNavigate();
  const [turfs, setTurfs] = useState(null);
  const [meta, setMeta] = useState({ districts: [], sports: [] });
  const [form, setForm] = useState({ q: '', sport: '', district: '' });

  useEffect(() => {
    api.get('/turfs/').then((r) => setTurfs(r.data)).catch(() => setTurfs([]));
    api.get('/meta/').then((r) => setMeta(r.data)).catch(() => {});
  }, []);

  const search = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    Object.entries(form).forEach(([k, v]) => v && p.set(k, v));
    navigate(`/turfs?${p.toString()}`);
  };

  const featured = (turfs || []).slice(0, 6);
  const districtsWithTurfs = [...new Set((turfs || []).map((t) => t.district))];

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="eyebrow">Football · Box Cricket · Badminton · Basketball</span>
          <h1>Book Kerala's finest <em>turfs</em> in minutes.</h1>
          <p className="lead">
            From Kochi's waterfront to Kozhikode's beach road. Find a floodlit ground near you, check live slots and lock in your game.
          </p>
          <div style={{ display: 'flex', gap: '.8rem', flexWrap: 'wrap', marginTop: '1.6rem' }}>
            <Link to="/turfs" className="btn btn-gold">Find a turf</Link>
            <Link to="/register?role=owner" className="btn btn-light">List your turf</Link>
          </div>
        </div>
      </section>

      <div className="container">
        <form className="searchbar" onSubmit={search}>
          <div>
            <label className="f" htmlFor="hq">Turf or area</label>
            <input id="hq" type="search" placeholder="e.g. Kakkanad, Marine Drive…" value={form.q}
              onChange={(e) => setForm({ ...form, q: e.target.value })} />
          </div>
          <div>
            <label className="f" htmlFor="hs">Sport</label>
            <select id="hs" value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })}>
              <option value="">Any sport</option>
              {meta.sports.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="f" htmlFor="hd">District</label>
            <select id="hd" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
              <option value="">All Kerala</option>
              {meta.districts.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <button className="btn btn-green">Search</button>
        </form>
      </div>

      <section className="section">
        <div className="container">
          <SectionTitle eyebrow="Choose your game" title="Play what you love">
            Five sports, one booking flow. Pick a category to see turfs across the state.
          </SectionTitle>
          <div className="grid grid-4">
            {Object.entries(SPORTS).map(([key, s]) => (
              <Link key={key} to={`/turfs?sport=${key}`} className="sport-card">
                <img src={s.img} alt="" loading="lazy" />
                <div className="txt"><span>{s.tag}</span><h3>{s.label}</h3></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <SectionTitle eyebrow="Top rated" title="Featured turfs">
            Highest-rated grounds right now, with live prices per hour.
          </SectionTitle>
          {turfs === null ? <Loader /> : (
            <div className="grid grid-3">
              {featured.map((t) => <TurfCard key={t.slug} turf={t} />)}
            </div>
          )}
          <div className="center" style={{ marginTop: '2rem' }}>
            <Link to="/turfs" className="btn btn-outline">View all turfs</Link>
          </div>
        </div>
      </section>

      <section className="section dark">
        <div className="container">
          <SectionTitle eyebrow="Simple as a penalty kick" title="How it works" />
          <div className="grid grid-2 steps">
            {STEPS.map(([t, d]) => (
              <div className="step" key={t}><h3>{t}</h3><p style={{ color: '#b6cbc0' }}>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionTitle eyebrow="Find it on the map" title="Turfs across Kerala">
            {districtsWithTurfs.length ? `Live in ${districtsWithTurfs.length} districts. ` : ''}Tap a pin for price and a quick link to book.
          </SectionTitle>
          {turfs && turfs.length > 0 && <MapView turfs={turfs} height={440} />}
          {districtsWithTurfs.length > 0 && (
            <div className="chips" style={{ justifyContent: 'center', marginTop: '1.4rem' }}>
              {districtsWithTurfs.map((d) => (
                <Link key={d} className="chip btnlike" to={`/turfs?district=${d}`}>{d}</Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <SectionTitle eyebrow="Why players choose us" title="Built for the game" />
          <div className="grid grid-4">
            {FEATURES.map(([ic, t, d]) => (
              <div className="feature" key={t}>
                <div className="ic">{ic}</div>
                <div><h3 style={{ fontSize: '1.1rem' }}>{t}</h3><p className="muted" style={{ marginBottom: 0 }}>{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta-band">
            <div className="in">
              <span className="eyebrow">For turf owners</span>
              <h2>Fill your empty hours.</h2>
              <p>List your ground, set weekday and weekend rates, and manage every booking from one dashboard.</p>
              <Link to="/register?role=owner" className="btn btn-gold">Become a partner</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
