import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import TurfCard from '../components/TurfCard';
import { Empty, Loader, PageHero } from '../components/ui';

export default function Favorites() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    api.get('/favorites/').then((r) => setItems(r.data)).catch(() => setItems([]));
  }, []);

  const onChange = (slug, isFav) => {
    if (!isFav) setItems((xs) => xs.filter((t) => t.slug !== slug));
  };

  return (
    <>
      <PageHero title="Saved turfs" subtitle="Your shortlist of favourite grounds." />
      <div className="container" style={{ padding: '2rem 0 4rem' }}>
        {items === null ? <Loader /> : items.length === 0 ? (
          <Empty icon="♡" title="No saved turfs yet">
            Tap the heart on any turf to keep it here. <br /><br />
            <Link to="/turfs" className="btn btn-green">Browse turfs</Link>
          </Empty>
        ) : (
          <div className="grid grid-3">
            {items.map((t) => <TurfCard key={t.slug} turf={t} onFavoriteChange={onChange} />)}
          </div>
        )}
      </div>
    </>
  );
}
