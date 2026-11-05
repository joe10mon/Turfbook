import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { errMsg } from '../utils';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    role: params.get('role') === 'owner' ? 'owner' : 'customer',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await register(form);
      navigate(u.role === 'owner' ? '/owner' : '/turfs', { replace: true });
    } catch (err) {
      setError(errMsg(err, 'Could not create your account.'));
    } finally { setBusy(false); }
  };

  return (
    <div className="container" style={{ padding: '3rem 0 4rem' }}>
      <div className="auth-wrap">
        <div className="auth-side" style={{ backgroundImage: "url('/img/turfs/cricket-night.svg')" }}>
          <div className="in">
            <span className="eyebrow">Join TurfBook</span>
            <h2>{form.role === 'owner' ? 'Grow your turf business.' : 'Your next game starts here.'}</h2>
            <p>{form.role === 'owner'
              ? 'List grounds, set rates and track every booking and rupee from a single dashboard.'
              : 'Create a free account to book live slots, save favourites and manage your games.'}</p>
          </div>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <h1 style={{ fontSize: '2rem' }}>Create account</h1>
          <div className="seg field" role="radiogroup" aria-label="Account type">
            <button type="button" className={form.role === 'customer' ? 'on' : ''} onClick={() => setForm({ ...form, role: 'customer' })}>I want to play</button>
            <button type="button" className={form.role === 'owner' ? 'on' : ''} onClick={() => setForm({ ...form, role: 'owner' })}>I own a turf</button>
          </div>
          {error && <div className="alert err">{error}</div>}
          <div className="field">
            <label className="f" htmlFor="n">Full name</label>
            <input id="n" required maxLength={80} value={form.name} onChange={set('name')} />
          </div>
          <div className="row">
            <div className="field">
              <label className="f" htmlFor="e">Email</label>
              <input id="e" type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
            </div>
            <div className="field">
              <label className="f" htmlFor="p">Mobile</label>
              <input id="p" type="tel" pattern="[0-9]{10}" placeholder="10 digits" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} />
            </div>
          </div>
          <div className="field">
            <label className="f" htmlFor="pw">Password</label>
            <input id="pw" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={set('password')} />
            <div className="help">At least 8 characters.</div>
          </div>
          <button className="btn btn-gold btn-block" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
          <p className="center" style={{ marginTop: '1rem' }}>Already registered? <Link to="/login">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
