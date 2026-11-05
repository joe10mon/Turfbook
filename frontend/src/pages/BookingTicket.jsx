import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import { Empty, Loader, useToast } from '../components/ui';
import { directionsUrl, errMsg, fmtDate, inr } from '../utils';

export default function BookingTicket() {
  const { code } = useParams();
  const toast = useToast();
  const [b, setB] = useState(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/bookings/${code}/`).then((r) => setB(r.data)).catch(() => setMissing(true));
  }, [code]);

  const cancel = async () => {
    if (!window.confirm('Cancel this booking? Paid amounts are refunded.')) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/bookings/${code}/cancel/`);
      setB(data);
      toast('Booking cancelled.');
    } catch (e) { toast(errMsg(e), 'err'); } finally { setBusy(false); }
  };

  if (missing) return <div className="container"><Empty icon="🎫" title="Booking not found"><Link to="/my-bookings" className="btn btn-green">My bookings</Link></Empty></div>;
  if (!b) return <Loader />;
  const cancelled = b.status === 'cancelled';

  return (
    <div className="container" style={{ padding: '2.5rem 0 4rem' }}>
      <div className="center" style={{ marginBottom: '1.6rem' }}>
        <div className="check-ico" style={{ background: cancelled ? 'var(--danger)' : 'var(--ok)', boxShadow: 'none' }}>{cancelled ? '✕' : '✓'}</div>
        <h1 style={{ fontSize: '2rem' }}>{cancelled ? 'Booking cancelled' : 'Booking confirmed'}</h1>
        <p className="muted">{cancelled ? 'This slot has been released.' : 'Show this code at the turf entrance. A copy is saved under My bookings.'}</p>
      </div>

      <div className="card ticket">
        <div className="top">
          <div>
            <div style={{ color: 'var(--gold-light)', fontSize: '.72rem', letterSpacing: 3, textTransform: 'uppercase' }}>Booking code</div>
            <h2>{b.turf_name}</h2>
          </div>
          <div className="code">{b.code}</div>
        </div>
        <div className="info">
          <div><small>Date</small><b>{fmtDate(b.date)}</b></div>
          <div><small>Time</small><b>{b.time_label}</b></div>
          <div><small>Duration</small><b>{b.hours} hour{b.hours > 1 ? 's' : ''}</b></div>
          <div><small>Player</small><b>{b.player_name}</b></div>
          <div><small>Mobile</small><b>{b.player_phone}</b></div>
          <div><small>Status</small><b><span className={`badge ${cancelled ? 'bad' : 'ok'}`}>{b.status_label}</span></b></div>
        </div>
        <div className="cut" />
        <div className="info">
          <div><small>Amount</small><b>{inr(b.amount)}</b></div>
          <div><small>Payment</small><b>{b.payment_label}</b></div>
          <div style={{ gridColumn: 'span 2' }}><small>Venue</small><b>{b.address}, {b.district}</b></div>
        </div>
        <div className="no-print" style={{ display: 'flex', gap: '.7rem', flexWrap: 'wrap', padding: '0 1.8rem 1.8rem' }}>
          <a className="btn btn-green btn-sm" href={directionsUrl(b.latitude, b.longitude)} target="_blank" rel="noreferrer">Directions ↗</a>
          <button className="btn btn-outline btn-sm" onClick={() => window.print()}>Print ticket</button>
          <Link className="btn btn-outline btn-sm" to="/my-bookings">All bookings</Link>
          {b.can_cancel && <button className="btn btn-danger btn-sm" onClick={cancel} disabled={busy}>{busy ? 'Cancelling…' : 'Cancel booking'}</button>}
        </div>
      </div>
    </div>
  );
}
