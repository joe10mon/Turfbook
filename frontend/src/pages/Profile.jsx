import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { PageHero, useToast } from '../components/ui';
import { errMsg } from '../utils';

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: user.name || '', phone: user.phone || '' });
  const [busy, setBusy] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProfile(form);
      toast('Profile updated.');
    } catch (err) { toast(errMsg(err), 'err'); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHero title="My profile" subtitle="Keep your contact details up to date." />
      <div className="container" style={{ padding: '2rem 0 4rem', maxWidth: 760 }}>
        <form className="card card-pad" onSubmit={save}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.4rem' }}>
            <div className="user-chip"><i style={{ width: 64, height: 64, fontSize: '1.7rem' }}>{(user.name || user.email)[0].toUpperCase()}</i></div>
            <div>
              <h3 style={{ margin: 0 }}>{user.name || 'Player'}</h3>
              <span className={`badge ${user.role === 'owner' ? '' : 'green'}`}>{user.role === 'owner' ? 'Turf owner' : 'Player'}</span>
            </div>
          </div>
          <div className="field">
            <label className="f">Email</label>
            <input type="email" value={user.email} disabled />
          </div>
          <div className="row">
            <div className="field">
              <label className="f" htmlFor="nm">Full name</label>
              <input id="nm" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label className="f" htmlFor="ph">Mobile</label>
              <input id="ph" type="tel" pattern="[0-9]{10}" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.7rem', flexWrap: 'wrap' }}>
            <button className="btn btn-green" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
            {user.role === 'owner'
              ? <Link to="/owner" className="btn btn-outline">Owner dashboard</Link>
              : <Link to="/my-bookings" className="btn btn-outline">My bookings</Link>}
            <button type="button" className="btn btn-danger" onClick={() => { logout(); navigate('/'); }}>Sign out</button>
          </div>
        </form>
      </div>
    </>
  );
}
