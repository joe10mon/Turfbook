import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Empty, Loader, PageHero, useToast } from '../components/ui';
import { errMsg, fmtDate, inr, todayISO } from '../utils';

export default function MyBookings() {
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [tab, setTab] = useState('upcoming');

  const load = () => api.get('/bookings/').then((r) => setItems(r.data)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const cancel = async (code) => {
    if (!window.confirm('Cancel this booking? Paid amounts are refunded.')) return;
    try {
      await api.post(`/bookings/${code}/cancel/`);
      toast('Booking cancelled.');
      load();
    } catch (e) { toast(errMsg(e), 'err'); }
  };

  const today = todayISO();
  const filters = {
    upcoming: (b) => b.status === 'confirmed' && b.date >= today,
    past: (b) => b.status === 'confirmed' && b.date < today,
    cancelled: (b) => b.status === 'cancelled',
  };
  const shown = (items || []).filter(filters[tab]);
  const count = (k) => (items || []).filter(filters[k]).length;

  return (
    <>
      <PageHero title="My bookings" subtitle="Upcoming games, history and cancellations." />
      <div className="container" style={{ padding: '2rem 0 4rem' }}>
        <div className="tabs">
          {['upcoming', 'past', 'cancelled'].map((k) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{k} ({count(k)})</button>
          ))}
        </div>
        {items === null ? <Loader /> : shown.length === 0 ? (
          <Empty icon="🎫" title={`No ${tab} bookings`}>
            <Link to="/turfs" className="btn btn-green">Find a turf</Link>
          </Empty>
        ) : shown.map((b) => (
          <div className="card booking-row" key={b.code}>
            <img src={b.turf_image} alt="" />
            <div>
              <h3><Link to={`/booking/${b.code}`}>{b.turf_name}</Link></h3>
              <div className="muted">{b.district} · {fmtDate(b.date)} · {b.time_label}</div>
              <div style={{ marginTop: '.4rem', display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`badge ${b.status === 'cancelled' ? 'bad' : 'ok'}`}>{b.status_label}</span>
                <span className="badge soft">{b.payment_label}</span>
                <strong>{inr(b.amount)}</strong>
                <code style={{ color: 'var(--muted)' }}>{b.code}</code>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              <Link className="btn btn-outline btn-sm" to={`/booking/${b.code}`}>View ticket</Link>
              {b.can_cancel && <button className="btn btn-danger btn-sm" onClick={() => cancel(b.code)}>Cancel</button>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
