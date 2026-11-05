import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { errMsg } from '../utils';

/** Works for both a router location ("?a=b") and a hand-built { pathname, search } ("a=b"). */
export const destination = (from, fallback = '/') => {
  if (!from) return fallback;
  const search = from.search ? (from.search.startsWith('?') ? from.search : `?${from.search}`) : '';
  return `${from.pathname || fallback}${search}`;
};

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={destination(from, user.role === 'owner' ? '/owner' : '/')} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(form.email, form.password);
      navigate(destination(from, u.role === 'owner' ? '/owner' : '/'), { replace: true });
    } catch (err) {
      setError(errMsg(err, 'Could not sign you in.'));
    } finally { setBusy(false); }
  };

  const fill = (email) => setForm({ email, password: 'demo1234' });

  return (
    <div className="container" style={{ padding: '3rem 0 4rem' }}>
      <div className="auth-wrap">
        <div className="auth-side">
          <div className="in">
            <span className="eyebrow">Welcome back</span>
            <h2>The pitch is waiting.</h2>
            <p>Sign in to manage bookings, save favourite grounds and rebook in two taps.</p>
          </div>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <h1 style={{ fontSize: '2rem' }}>Sign in</h1>
          {from && <div className="alert info">Please sign in to continue.</div>}
          {error && <div className="alert err">{error}</div>}
          <div className="field">
            <label className="f" htmlFor="em">Email</label>
            <input id="em" type="email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field">
            <label className="f" htmlFor="pw">Password</label>
            <input id="pw" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button className="btn btn-green btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="center" style={{ marginTop: '1rem' }}>New here? <Link to="/register">Create an account</Link></p>
          <div className="alert info" style={{ marginTop: '1rem', fontSize: '.82rem' }}>
            Demo accounts after running <code>seed_turfs</code>:<br />
            <button type="button" className="chip btnlike" onClick={() => fill('player@turfbook.in')}>Player</button>{' '}
            <button type="button" className="chip btnlike" onClick={() => fill('owner@turfbook.in')}>Turf owner</button>{' '}
            (password <code>demo1234</code>)
          </div>
        </form>
      </div>
    </div>
  );
}
