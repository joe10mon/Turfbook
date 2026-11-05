import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';
import { inr, SPORTS } from '../utils';
import { Stars, useToast } from './ui';

export default function TurfCard({ turf, onHover, onFavoriteChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [fav, setFav] = useState(turf.is_favorite);

  const toggleFav = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login', { state: { from: location } });
    try {
      const { data } = await api.post(`/turfs/${turf.slug}/favorite/`);
      setFav(data.is_favorite);
      onFavoriteChange?.(turf.slug, data.is_favorite);
    } catch {
      toast('Could not update favourites.', 'err');
    }
  };

  return (
    <article
      className="card turf-card"
      onMouseEnter={() => onHover?.(turf.slug)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="img">
        <Link to={`/turfs/${turf.slug}`} aria-label={turf.name}>
          <img src={turf.images?.[0]} alt={`${turf.name} turf`} loading="lazy" />
        </Link>
        <span className="badge">{SPORTS[turf.sport]?.label || turf.sport_label}</span>
        <button className={`fav ${fav ? 'on' : ''}`} onClick={toggleFav} aria-label={fav ? 'Remove from favourites' : 'Save to favourites'}>
          {fav ? '♥' : '♡'}
        </button>
      </div>
      <div className="body">
        <h3><Link to={`/turfs/${turf.slug}`}>{turf.name}</Link></h3>
        <div className="loc">
          ⌖ {turf.district}
          {turf.distance_km != null && <> · {turf.distance_km} km away</>}
        </div>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', fontSize: '.88rem' }}>
          {turf.avg_rating ? (
            <>
              <Stars value={turf.avg_rating} /> <strong>{turf.avg_rating}</strong>
              <span className="muted">({turf.review_count})</span>
            </>
          ) : (
            <span className="muted">No reviews yet</span>
          )}
          {turf.size && <span className="chip" style={{ marginLeft: 'auto' }}>{turf.size}</span>}
        </div>
        <div className="foot">
          <div className="price">{inr(turf.price_per_hour)} <small>/ hour</small></div>
          <Link className="btn btn-green btn-sm" to={`/turfs/${turf.slug}`}>Book now</Link>
        </div>
      </div>
    </article>
  );
}
