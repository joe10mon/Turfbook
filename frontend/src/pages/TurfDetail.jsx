import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';
import MapView from '../components/MapView';
import { Empty, Loader, PageHero, Stars, useToast } from '../components/ui';
import { addDays, directionsUrl, errMsg, inr, SPORTS, todayISO } from '../utils';

const DAYS = 14;

export default function TurfDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [turf, setTurf] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [img, setImg] = useState(0);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState(null);
  const [picked, setPicked] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [fav, setFav] = useState(false);
  const [rv, setRv] = useState({ rating: 5, comment: '' });
  const [rvBusy, setRvBusy] = useState(false);

  const loadTurf = useCallback(() => {
    api.get(`/turfs/${slug}/`).then((r) => { setTurf(r.data); setFav(r.data.is_favorite); }).catch(() => setNotFound(true));
    api.get(`/turfs/${slug}/reviews/`).then((r) => setReviews(r.data)).catch(() => {});
  }, [slug]);

  useEffect(() => { loadTurf(); }, [loadTurf]);

  useEffect(() => {
    setSlots(null);
    setPicked([]);
    api.get(`/turfs/${slug}/availability/`, { params: { date } })
      .then((r) => setSlots(r.data.slots))
      .catch(() => setSlots([]));
  }, [slug, date]);

  const dates = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(todayISO(), i)), []);

  // Only allow a consecutive run of hours: picking a non-adjacent slot starts a new selection.
  const togglePick = (h) => {
    setPicked((cur) => {
      if (cur.includes(h)) {
        const next = cur.filter((x) => x !== h).sort((a, b) => a - b);
        const contiguous = next.every((x, i) => i === 0 || x === next[i - 1] + 1);
        return contiguous ? next : [h];
      }
      const next = [...cur, h].sort((a, b) => a - b);
      const contiguous = next.every((x, i) => i === 0 || x === next[i - 1] + 1);
      return contiguous && next.length <= 6 ? next : [h];
    });
  };

  const total = (slots || []).filter((s) => picked.includes(s.hour)).reduce((a, s) => a + s.price, 0);

  const book = () => {
    const target = `/checkout?turf=${slug}&date=${date}&hours=${picked.join(',')}`;
    if (!user) return navigate('/login', { state: { from: { pathname: '/checkout', search: target.split('?')[1] } } });
    if (user.role === 'owner') return toast('Turf owner accounts cannot book. Use a player account.', 'err');
    navigate(target);
  };

  const toggleFav = async () => {
    if (!user) return navigate('/login', { state: { from: location } });
    try {
      const { data } = await api.post(`/turfs/${slug}/favorite/`);
      setFav(data.is_favorite);
    } catch (e) { toast(errMsg(e), 'err'); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setRvBusy(true);
    try {
      await api.post(`/turfs/${slug}/reviews/`, rv);
      toast('Thanks for your review!');
      setRv({ rating: 5, comment: '' });
      loadTurf();
    } catch (err) { toast(errMsg(err), 'err'); } finally { setRvBusy(false); }
  };

  if (notFound) return <div className="container"><Empty icon="🥅" title="Turf not found"><Link to="/turfs" className="btn btn-green">Browse turfs</Link></Empty></div>;
  if (!turf) return <Loader />;

  const imgs = turf.images || [];
  const d = new Date(date + 'T00:00:00');
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;

  return (
    <>
      <PageHero title={turf.name} crumb={<><Link to="/turfs">Turfs</Link> / {turf.district}</>}
        subtitle={`${SPORTS[turf.sport]?.label || turf.sport_label} · ${turf.address}`} />
      <div className="container detail">
        <div>
          <div className="gallery">
            <div className="main"><img src={imgs[img]} alt={`${turf.name}, view ${img + 1}`} /></div>
            <div className="thumbs">
              {imgs.slice(0, 3).map((src, i) => (
                <button key={src + i} className={i === img ? 'on' : ''} onClick={() => setImg(i)} aria-label={`Show photo ${i + 1}`}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', margin: '1.6rem 0 .6rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '.7rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {turf.avg_rating ? <><Stars value={turf.avg_rating} size="1.2rem" /> <strong>{turf.avg_rating}</strong> <span className="muted">({turf.review_count} reviews)</span></> : <span className="muted">No reviews yet</span>}
              <span className="badge">{turf.sport_label}</span>
              {turf.size && <span className="badge soft">{turf.size}</span>}
            </div>
            <button className="btn btn-outline btn-sm" onClick={toggleFav}>{fav ? '♥ Saved' : '♡ Save'}</button>
          </div>

          <h2>About this turf</h2>
          <p>{turf.description || 'A well-kept ground for friendly games and tournaments.'}</p>
          <p className="muted">Surface: {turf.surface || 'Artificial turf'} · Open {turf.open_hour}:00 – {turf.close_hour}:00 · Hosted by {turf.owner_name || 'the owner'}</p>

          {turf.amenities?.length > 0 && (
            <>
              <h2 style={{ marginTop: '2rem' }}>Amenities</h2>
              <div className="amen">{turf.amenities.map((a) => <div key={a}>{a}</div>)}</div>
            </>
          )}

          <h2 style={{ marginTop: '2rem' }}>Location</h2>
          <p className="muted">{turf.address}, {turf.district}</p>
          <MapView turfs={[turf]} height={300} popups={false} />
          <p style={{ marginTop: '.8rem' }}>
            <a className="btn btn-green btn-sm" href={directionsUrl(turf.latitude, turf.longitude)} target="_blank" rel="noreferrer">Get directions ↗</a>
          </p>

          <h2 style={{ marginTop: '2rem' }}>Reviews</h2>
          {reviews.length === 0 ? <p className="muted">Be the first to review this turf.</p> : (
            <div className="card card-pad">
              {reviews.map((r) => (
                <div className="review" key={r.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{r.user_name}</strong>
                    <span className="muted" style={{ fontSize: '.8rem' }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  <Stars value={r.rating} />
                  {r.comment && <p style={{ margin: '.3rem 0 0' }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}

          {user && user.role !== 'owner' && (
            <form className="card card-pad" style={{ marginTop: '1.2rem' }} onSubmit={submitReview}>
              <h3>Rate your experience</h3>
              <div className="starpick" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button type="button" key={i} className={i <= rv.rating ? 'on' : ''} onClick={() => setRv({ ...rv, rating: i })} aria-label={`${i} stars`}>★</button>
                ))}
              </div>
              <div className="field">
                <textarea placeholder="How was the surface, lighting and facilities?" maxLength={1000} value={rv.comment} onChange={(e) => setRv({ ...rv, comment: e.target.value })} />
              </div>
              <button className="btn btn-green btn-sm" disabled={rvBusy}>{rvBusy ? 'Posting…' : 'Post review'}</button>
            </form>
          )}
        </div>

        <aside className="card card-pad book-box">
          <div className="price" style={{ fontSize: '1.7rem' }}>{inr(turf.price_per_hour)} <small>/ hour</small></div>
          {turf.weekend_price && <div className="muted" style={{ fontSize: '.85rem' }}>Weekends {inr(turf.weekend_price)} / hour</div>}
          <hr style={{ border: 0, borderTop: '1px dashed var(--line)', margin: '1rem 0' }} />

          <label className="f">Pick a date</label>
          <div className="datestrip">
            {dates.map((iso) => {
              const dd = new Date(iso + 'T00:00:00');
              return (
                <button key={iso} className={iso === date ? 'on' : ''} onClick={() => setDate(iso)}>
                  <small>{dd.toLocaleDateString('en-IN', { weekday: 'short' })}</small>
                  <b>{dd.getDate()}</b>
                  <small>{dd.toLocaleDateString('en-IN', { month: 'short' })}</small>
                </button>
              );
            })}
          </div>
          {isWeekend && turf.weekend_price && <div className="alert info" style={{ padding: '.5rem .8rem' }}>Weekend rates apply.</div>}

          <label className="f">Select hours <span className="muted" style={{ textTransform: 'none', letterSpacing: 0 }}>(consecutive)</span></label>
          {slots === null ? <Loader /> : slots.length === 0 ? <p className="muted">No slots for this day.</p> : (
            <div className="slots">
              {slots.map((s) => (
                <button key={s.hour} disabled={!s.available} className={`slot ${picked.includes(s.hour) ? 'sel' : ''}`} onClick={() => togglePick(s.hour)}>
                  {s.label}
                  <small>{s.state === 'booked' ? 'Booked' : s.state === 'past' ? 'Passed' : inr(s.price)}</small>
                </button>
              ))}
            </div>
          )}
          <div className="legend">
            <span><i /> Available</span>
            <span><i style={{ background: 'var(--green-900)' }} /> Selected</span>
            <span><i style={{ background: '#f0ebdc', borderColor: 'var(--line)' }} /> Unavailable</span>
          </div>

          <div className="total">
            <span>{picked.length ? `${picked.length} hour${picked.length > 1 ? 's' : ''}` : 'Total'}</span>
            <span className="price">{inr(total)}</span>
          </div>
          <button className="btn btn-gold btn-block" disabled={!picked.length} onClick={book}>
            {picked.length ? 'Continue to checkout' : 'Select a slot'}
          </button>
          <p className="help center" style={{ marginTop: '.7rem' }}>Free cancellation up to 2 hours before start.</p>
        </aside>
      </div>
    </>
  );
}
