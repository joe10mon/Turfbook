import { createContext, useCallback, useContext, useState } from 'react';
import { Link } from 'react-router-dom';

export function Stars({ value, size = '1rem' }) {
  const v = Math.round(value || 0);
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value || 0} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= v ? '' : 'off'}>★</span>
      ))}
    </span>
  );
}

export function Loader() {
  return <div className="spinner" role="status" aria-label="Loading" />;
}

export function Empty({ icon = '⚽', title, children }) {
  return (
    <div className="empty">
      <span className="big">{icon}</span>
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

export function PageHero({ title, subtitle, crumb }) {
  return (
    <section className="page-hero">
      <div className="container">
        <div className="crumbs">
          <Link to="/">Home</Link> &nbsp;/&nbsp; {crumb || title}
        </div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  );
}

export function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="section-title">
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      <div className="orn">❖</div>
      {children && <p>{children}</p>}
    </div>
  );
}

/* ---------- toasts ---------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, kind = 'ok') => {
    const id = Math.random().toString(36).slice(2);
    setItems((xs) => [...xs, { id, text, kind }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind === 'err' ? 'err' : ''}`}>{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
