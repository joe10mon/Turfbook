import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';
import { Empty, Loader, PageHero, useToast } from '../components/ui';
import { errMsg, fmtDate, hourLabel, inr } from '../utils';

const PAY = [
  ['upi', 'UPI', 'GPay, PhonePe, Paytm and other UPI apps'],
  ['card', 'Debit / credit card', 'Visa, Mastercard, RuPay'],
  ['venue', 'Pay at venue', 'Reserve now, pay in cash or UPI at the turf'],
];

export default function Checkout() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const slug = params.get('turf');
  const date = params.get('date');
  const hours = (params.get('hours') || '').split(',').map(Number).filter((n) => !Number.isNaN(n) && n >= 0).sort((a, b) => a - b);

  const [turf, setTurf] = useState(null);
  const [slots, setSlots] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ player_name: user?.name || '', player_phone: user?.phone || '', payment_method: 'upi', agree: false });

  const valid = slug && date && hours.length > 0;

  useEffect(() => {
    if (!valid) return;
    api.get(`/turfs/${slug}/`).then((r) => setTurf(r.data)).catch(() => setError('This turf could not be found.'));
    api.get(`/turfs/${slug}/availability/`, { params: { date } }).then((r) => setSlots(r.data.slots)).catch(() => setSlots([]));
  }, [slug, date]); // eslint-disable-line

  if (!valid) {
    return <div className="container"><Empty icon="🗓" title="Nothing to check out"><Link to="/turfs" className="btn btn-green">Find a turf</Link></Empty></div>;
  }
  if (error) return <div className="container"><Empty icon="🥅" title={error}><Link to="/turfs" className="btn btn-green">Browse turfs</Link></Empty></div>;
  if (!turf || !slots) return <Loader />;

  const chosen = slots.filter((s) => hours.includes(s.hour));
  const stillOk = chosen.length === hours.length && chosen.every((s) => s.available);
  const total = chosen.reduce((a, s) => a + s.price, 0);
  const start = hours[0];
  const end = hours[hours.length - 1] + 1;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post('/bookings/', {
        turf: slug, date, hours,
        player_name: form.player_name,
        player_phone: form.player_phone,
        payment_method: form.payment_method,
      });
      toast('Booking confirmed!');
      navigate(`/booking/${data.code}`, { replace: true });
    } catch (err) {
      setError(errMsg(err));
      // Refresh slots so the player can see what changed.
      api.get(`/turfs/${slug}/availability/`, { params: { date } }).then((r) => setSlots(r.data.slots)).catch(() => {});
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageHero title="Checkout" subtitle="Review your slot, add player details and confirm." />
      <div className="container checkout">
        <form className="card card-pad" onSubmit={submit}>
          {!stillOk && (
            <div className="alert err">
              One or more of these slots is no longer available. <Link to={`/turfs/${slug}`}>Pick different hours</Link>.
            </div>
          )}
          {error && <div className="alert err">{error}</div>}

          <h3>Player details</h3>
          <div className="row">
            <div className="field">
              <label className="f" htmlFor="pn">Full name</label>
              <input id="pn" required maxLength={80} value={form.player_name} onChange={(e) => setForm({ ...form, player_name: e.target.value })} />
            </div>
            <div className="field">
              <label className="f" htmlFor="pp">Mobile number</label>
              <input id="pp" type="tel" required pattern="[0-9]{10}" inputMode="numeric" placeholder="10-digit number" value={form.player_phone}
                onChange={(e) => setForm({ ...form, player_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
            </div>
          </div>

          <h3 style={{ marginTop: '1rem' }}>Payment</h3>
          {PAY.map(([v, t, d]) => (
            <label key={v} className={`pay-opt ${form.payment_method === v ? 'on' : ''}`}>
              <input type="radio" name="pay" checked={form.payment_method === v} onChange={() => setForm({ ...form, payment_method: v })} />
              <span><strong>{t}</strong><br /><span className="muted" style={{ fontSize: '.85rem' }}>{d}</span></span>
            </label>
          ))}
          <div className="alert info" style={{ marginTop: '.8rem' }}>
            Demo checkout: UPI and card bookings are marked paid instantly and no money moves. Connect a payment gateway before going live.
          </div>

          <label className="check" style={{ margin: '1rem 0' }}>
            <input type="checkbox" required checked={form.agree} onChange={(e) => setForm({ ...form, agree: e.target.checked })} />
            <span>I agree to the <Link to="/terms" target="_blank">terms &amp; cancellation policy</Link>.</span>
          </label>
          <button className="btn btn-gold btn-block" disabled={busy || !stillOk}>
            {busy ? 'Confirming…' : form.payment_method === 'venue' ? `Reserve slot · ${inr(total)}` : `Pay ${inr(total)} & confirm`}
          </button>
        </form>

        <aside className="card card-pad" style={{ borderTop: '4px solid var(--gold)' }}>
          <img src={turf.images?.[0]} alt="" style={{ borderRadius: 4, marginBottom: '1rem', aspectRatio: '3/2', objectFit: 'cover', width: '100%' }} />
          <h3 style={{ marginBottom: '.1rem' }}>{turf.name}</h3>
          <div className="muted" style={{ marginBottom: '1rem' }}>{turf.address}, {turf.district}</div>
          <div className="sum-row"><span>Date</span><strong>{fmtDate(date)}</strong></div>
          <div className="sum-row"><span>Time</span><strong>{hourLabel(start)} – {hourLabel(end)}</strong></div>
          <div className="sum-row"><span>Duration</span><strong>{hours.length} hour{hours.length > 1 ? 's' : ''}</strong></div>
          <div className="sum-row"><span>Rate</span><strong>{chosen[0] ? inr(chosen[0].price) : '—'} / hour</strong></div>
          <div className="sum-row tot"><span>Total</span><span>{inr(total)}</span></div>
          <p className="help" style={{ marginTop: '.8rem' }}>Free cancellation until 2 hours before start.</p>
        </aside>
      </div>
    </>
  );
}
