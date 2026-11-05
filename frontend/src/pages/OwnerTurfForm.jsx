import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import LocationPicker from '../components/LocationPicker';
import { Loader, PageHero, useToast } from '../components/ui';
import { errMsg } from '../utils';

const EMPTY = {
  name: '', sport: 'football', description: '', district: 'Ernakulam', address: '',
  latitude: '', longitude: '', price_per_hour: 1000, weekend_price: '',
  open_hour: 6, close_hour: 23, size: '', surface: 'Artificial turf', amenities: [], images: [], is_active: true,
};

export default function OwnerTurfForm() {
  const { slug } = useParams();
  const editing = Boolean(slug);
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef(null);

  const [meta, setMeta] = useState({ districts: [], sports: [], amenities: [] });
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/meta/').then((r) => setMeta(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editing) return;
    api.get(`/turfs/${slug}/`)
      .then((r) => {
        const t = r.data;
        // Placeholder images are filled in by the API when none are uploaded; don't save those back as real uploads.
        const real = (t.images || []).filter((u) => !u.startsWith('/img/turfs/'));
        setForm({ ...EMPTY, ...t, weekend_price: t.weekend_price ?? '', images: real });
      })
      .catch(() => setError('Could not load this turf.'))
      .finally(() => setLoading(false));
  }, [slug, editing]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const toggleAmenity = (a) =>
    setForm({ ...form, amenities: form.amenities.includes(a) ? form.amenities.filter((x) => x !== a) : [...form.amenities, a] });

  const upload = async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const f of files) {
        const fd = new FormData();
        fd.append('file', f);
        const { data } = await api.post('/uploads/', fd);
        urls.push(data.url);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls].slice(0, 8) }));
    } catch (err) { toast(errMsg(err), 'err'); } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.latitude === '' || form.longitude === '') {
      setError('Please set the turf location on the map.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setBusy(true);
    const payload = {
      ...form,
      price_per_hour: Number(form.price_per_hour),
      weekend_price: form.weekend_price === '' ? null : Number(form.weekend_price),
      open_hour: Number(form.open_hour),
      close_hour: Number(form.close_hour),
    };
    try {
      if (editing) await api.put(`/turfs/${slug}/`, payload);
      else await api.post('/turfs/', payload);
      toast(editing ? 'Turf updated.' : 'Turf listed. Players can book it now.');
      navigate('/owner');
    } catch (err) {
      setError(errMsg(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setBusy(false); }
  };

  if (loading) return <Loader />;

  return (
    <>
      <PageHero title={editing ? 'Edit turf' : 'List a new turf'} crumb={<><Link to="/owner">Dashboard</Link> / {editing ? 'Edit' : 'New'}</>}
        subtitle="Add details, drop a pin on the map and set your hourly rates." />
      <form className="container" style={{ padding: '2rem 0 4rem', maxWidth: 900 }} onSubmit={submit}>
        {error && <div className="alert err">{error}</div>}

        <div className="card card-pad" style={{ marginBottom: '1.4rem' }}>
          <h3>Basics</h3>
          <div className="field">
            <label className="f" htmlFor="nm">Turf name</label>
            <input id="nm" required maxLength={120} value={form.name} onChange={set('name')} />
          </div>
          <div className="row">
            <div className="field">
              <label className="f" htmlFor="sp">Sport</label>
              <select id="sp" value={form.sport} onChange={set('sport')}>
                {meta.sports.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="f" htmlFor="di">District</label>
              <select id="di" value={form.district} onChange={set('district')}>
                {meta.districts.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label className="f" htmlFor="ad">Address</label>
            <input id="ad" required maxLength={255} placeholder="Street, locality, town" value={form.address} onChange={set('address')} />
          </div>
          <div className="row">
            <div className="field">
              <label className="f" htmlFor="sz">Format / size</label>
              <input id="sz" placeholder="e.g. 7-a-side, 60x40 ft" value={form.size} onChange={set('size')} />
            </div>
            <div className="field">
              <label className="f" htmlFor="sf">Surface</label>
              <input id="sf" value={form.surface} onChange={set('surface')} />
            </div>
          </div>
          <div className="field">
            <label className="f" htmlFor="ds">Description</label>
            <textarea id="ds" value={form.description} onChange={set('description')} placeholder="What makes your ground special?" />
          </div>
        </div>

        <div className="card card-pad" style={{ marginBottom: '1.4rem' }}>
          <h3>Location on map</h3>
          <LocationPicker lat={form.latitude} lng={form.longitude} onChange={(la, ln) => setForm((f) => ({ ...f, latitude: la, longitude: ln }))} />
        </div>

        <div className="card card-pad" style={{ marginBottom: '1.4rem' }}>
          <h3>Pricing &amp; hours</h3>
          <div className="row">
            <div className="field">
              <label className="f" htmlFor="pr">Weekday rate (₹ / hour)</label>
              <input id="pr" type="number" min="100" step="50" required value={form.price_per_hour} onChange={set('price_per_hour')} />
            </div>
            <div className="field">
              <label className="f" htmlFor="wr">Weekend rate (₹ / hour)</label>
              <input id="wr" type="number" min="100" step="50" placeholder="Same as weekday" value={form.weekend_price} onChange={set('weekend_price')} />
            </div>
          </div>
          <div className="row">
            <div className="field">
              <label className="f" htmlFor="oh">Opens at</label>
              <select id="oh" value={form.open_hour} onChange={set('open_hour')}>
                {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
              </select>
            </div>
            <div className="field">
              <label className="f" htmlFor="ch">Closes at</label>
              <select id="ch" value={form.close_hour} onChange={set('close_hour')}>
                {Array.from({ length: 24 }, (_, h) => h + 1).map((h) => <option key={h} value={h}>{String(h % 24).padStart(2, '0')}:00{h === 24 ? ' (midnight)' : ''}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card card-pad" style={{ marginBottom: '1.4rem' }}>
          <h3>Amenities</h3>
          <div className="amen" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
            {meta.amenities.map((a) => (
              <label className="check" key={a}><input type="checkbox" checked={form.amenities.includes(a)} onChange={() => toggleAmenity(a)} /> {a}</label>
            ))}
          </div>
        </div>

        <div className="card card-pad" style={{ marginBottom: '1.4rem' }}>
          <h3>Photos</h3>
          <p className="muted">Upload up to 8 JPG, PNG or WebP images (3 MB each). If you add none, a stylised illustration for your sport is shown.</p>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} disabled={uploading || form.images.length >= 8} />
          {uploading && <div className="help">Uploading…</div>}
          <div className="upload-grid">
            {form.images.map((u) => (
              <div className="u" key={u}>
                <img src={u} alt="" />
                <button type="button" aria-label="Remove photo" onClick={() => setForm({ ...form, images: form.images.filter((x) => x !== u) })}>×</button>
              </div>
            ))}
          </div>
        </div>

        <label className="check"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Listing is live and bookable</label>
        <div style={{ display: 'flex', gap: '.8rem', marginTop: '1rem' }}>
          <button className="btn btn-gold" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish turf'}</button>
          <Link to="/owner" className="btn btn-outline">Cancel</Link>
        </div>
      </form>
    </>
  );
}
