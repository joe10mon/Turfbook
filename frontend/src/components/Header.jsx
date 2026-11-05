import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  const signOut = () => {
    logout();
    close();
    navigate('/');
  };

  return (
    <>
      <div className="topbar">
        <div className="container">
          <span>★ Kerala's turf booking platform · 14 districts</span>
          <span>
            Help: <a href="tel:+918000000000">+91 80000 00000</a> · <a href="mailto:hello@turfbook.example">hello@turfbook.example</a>
          </span>
        </div>
      </div>
      <header className="header">
        <div className="container">
          <Link to="/" className="brand" onClick={close}>
            <img src="/logo.svg" alt="" />
            <span><b>TurfBook</b><small>Kerala</small></span>
          </Link>
          <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>☰</button>
          <nav className={`nav ${open ? 'open' : ''}`} onClick={(e) => e.target.closest('a') && close()}>
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/turfs">Find a Turf</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/faq">FAQ</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            {user ? (
              <>
                {user.role === 'owner' ? (
                  <NavLink to="/owner">Dashboard</NavLink>
                ) : (
                  <>
                    <NavLink to="/my-bookings">My Bookings</NavLink>
                    <NavLink to="/favorites">Saved</NavLink>
                  </>
                )}
                <NavLink to="/profile" className="user-chip">
                  <i>{(user.name || user.email)[0].toUpperCase()}</i> {user.name?.split(' ')[0] || 'Account'}
                </NavLink>
                <button className="linklike" onClick={signOut}>Sign out</button>
              </>
            ) : (
              <>
                <NavLink to="/login">Sign in</NavLink>
                <Link to="/register" className="btn btn-gold btn-sm">Join free</Link>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
