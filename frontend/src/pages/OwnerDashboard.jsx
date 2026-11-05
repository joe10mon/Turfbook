import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Empty, Loader, PageHero, useToast } from '../components/ui';
import { errMsg, fmtDate, inr } from '../utils';

export default function OwnerDashboard() {
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [turfs, setTurfs] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [filter, setFilter] = useState('');

  const loadTurfs = useCallback(() => api.get('/turfs/', { params: { mine: 1 } }).then((r) => setTurfs(r.data)).catch(() => setTurfs([])), []);
  const loadStats = useCallback(() => api.get('/owner/stats/').then((r) => setStats(r.data)).catch(() => setStats(false)), []);
  const loadBookings = useCallback(
    () => api.get('/owner/bookings/', { params: filter ? { status: filter } : {} }).then((r) => setBookings(r.data)).catch(() => setBookings([])),
    [filter]
  );

  useEffect(() => { loadStats(); loadTurfs(); }, [loadStats, loadTurfs]);
  useEffect(() => { loadBookings(); }, [loadBookings]);

  const toggleActive = async (t) => {
    try {
      await api.patch(`/turfs/${t.slug}/`, { is_active: !t.is_active });
      toast(t.is_active ? 'Turf hidden from search.' : 'Turf is live again.');
      loadTurfs();
    } catch (e) { toast(errMsg(e), 'err'); }
  };

  const remove = async (t) => {
    if (!window.confirm(`Delete "${t.name}" and all its bookings? This cannot be undone.`)) return;
    try {
      await api.delete(`/turfs/${t.slug}/`);
      toast('Turf deleted.');
      loadTurfs(); loadStats(); loadBookings();
    } catch (e) { toast(errMsg(e), 'err'); }
  };

  const cancelBooking = async (code) => {
    if (!window.confirm('Cancel this booking and release the slot? Paid amounts are marked refunded.')) return;
    try {
      await api.post(`/bookings/${code}/cancel/`);
      toast('Booking cancelled.');
      loadBookings(); loadStats();
    } catch (e) { toast(errMsg(e), 'err'); }
  };

  const max = Math.max(1, ...(stats?.last_7_days || []).map((d) => d.revenue));

  return (
    <>
      <PageHero title="Owner dashboard" subtitle="Manage your turfs, rates and bookings." />
      <div className="container" style={{ padding: '2rem 0 4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }} className="tabs">
          <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
            {[['overview', 'Overview'], ['turfs', 'My turfs'], ['bookings', 'Bookings']].map(([k, l]) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
          <Link to="/owner/turfs/new" className="btn btn-gold btn-sm" style={{ marginBottom: '.4rem' }}>+ Add turf</Link>
        </div>

        {tab === 'overview' && (stats === null ? <Loader /> : stats === false ? <div className="alert err">Could not load stats.</div> : (
          <>
            <div className="grid grid-4">
              <div className="card stat"><small>Total revenue</small><b>{inr(stats.total_revenue)}</b></div>
              <div className="card stat"><small>Confirmed bookings</small><b>{stats.total_bookings}</b></div>
              <div className="card stat"><small>Upcoming</small><b>{stats.upcoming}</b></div>
              <div className="card stat"><small>Playing today</small><b>{stats.today}</b></div>
            </div>
            <div className="grid grid-2" style={{ marginTop: '1.5rem' }}>
              <div className="card card-pad">
                <h3>Revenue · last 7 days</h3>
                <div className="bars">
                  {stats.last_7_days.map((d) => (
                    <div className="col" key={d.date}>
                      <span className="val">{d.revenue ? inr(d.revenue) : ''}</span>
                      <div className="bar" style={{ height: `${(d.revenue / max) * 100}%` }} title={`${d.bookings} bookings`} />
                      <span>{new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card card-pad">
                <h3>Performance by turf</h3>
                {stats.by_turf.length === 0 ? <p className="muted">No bookings yet. Share your listing to get started.</p> : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Turf</th><th>Bookings</th><th>Revenue</th></tr></thead>
                      <tbody>{stats.by_turf.map((r) => <tr key={r.name}><td>{r.name}</td><td>{r.bookings}</td><td>{inr(r.revenue)}</td></tr>)}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        ))}

        {tab === 'turfs' && (turfs === null ? <Loader /> : turfs.length === 0 ? (
          <Empty icon="🏟" title="You haven't listed a turf yet">
            <Link to="/owner/turfs/new" className="btn btn-gold">Add your first turf</Link>
          </Empty>
        ) : (
          <div className="card table-wrap">
            <table>
              <thead><tr><th></th><th>Turf</th><th>District</th><th>Sport</th><th>Rate</th><th>Rating</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {turfs.map((t) => (
                  <tr key={t.slug}>
                    <td style={{ width: 84 }}><img src={t.images?.[0]} alt="" style={{ width: 72, aspectRatio: '3/2', objectFit: 'cover', borderRadius: 3 }} /></td>
                    <td><Link to={`/turfs/${t.slug}`}><strong>{t.name}</strong></Link></td>
                    <td>{t.district}</td>
                    <td>{t.sport_label}</td>
                    <td>{inr(t.price_per_hour)}</td>
                    <td>{t.avg_rating ? `${t.avg_rating} ★ (${t.review_count})` : '—'}</td>
                    <td><span className={`badge ${t.is_active ? 'ok' : 'bad'}`}>{t.is_active ? 'Live' : 'Hidden'}</span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <Link className="btn btn-outline btn-sm" to={`/owner/turfs/${t.slug}/edit`}>Edit</Link>{' '}
                      <button className="btn btn-outline btn-sm" onClick={() => toggleActive(t)}>{t.is_active ? 'Hide' : 'Show'}</button>{' '}
                      <button className="btn btn-danger btn-sm" onClick={() => remove(t)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {tab === 'bookings' && (
          <>
            <div style={{ marginBottom: '1rem', maxWidth: 240 }}>
              <select aria-label="Status filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="">All bookings</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            {bookings === null ? <Loader /> : bookings.length === 0 ? (
              <Empty icon="🎫" title="No bookings yet">They will appear here as players book your slots.</Empty>
            ) : (
              <div className="card table-wrap">
                <table>
                  <thead><tr><th>Code</th><th>Turf</th><th>Date</th><th>Time</th><th>Player</th><th>Amount</th><th>Payment</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.code}>
                        <td><code>{b.code}</code></td>
                        <td>{b.turf_name}</td>
                        <td>{fmtDate(b.date)}</td>
                        <td>{b.time_label}</td>
                        <td>{b.player_name}<br /><span className="muted" style={{ fontSize: '.8rem' }}>{b.player_phone}</span></td>
                        <td>{inr(b.amount)}</td>
                        <td><span className="badge soft">{b.payment_label}</span></td>
                        <td><span className={`badge ${b.status === 'cancelled' ? 'bad' : 'ok'}`}>{b.status_label}</span></td>
                        <td>{b.status === 'confirmed' && <button className="btn btn-danger btn-sm" onClick={() => cancelBooking(b.code)}>Cancel</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
