import { Link } from 'react-router-dom';

const POPULAR = ['Ernakulam', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kannur'];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="cols">
          <div>
            <Link to="/" className="brand">
              <img src="/logo.svg" alt="" />
              <span><b>TurfBook</b><small>Kerala</small></span>
            </Link>
            <p style={{ marginTop: '1rem', maxWidth: '34ch' }}>
              Real-time turf slots across God's Own Country. Pick a ground on the map, choose your hour, and play.
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <Link to="/turfs">Find a turf</Link>
            <Link to="/turfs?sport=football">Football</Link>
            <Link to="/turfs?sport=cricket">Box cricket</Link>
            <Link to="/turfs?sport=badminton">Badminton</Link>
            <Link to="/turfs?sport=basketball">Basketball</Link>
          </div>
          <div>
            <h4>Popular districts</h4>
            {POPULAR.map((d) => (
              <Link key={d} to={`/turfs?district=${d}`}>{d}</Link>
            ))}
          </div>
          <div>
            <h4>Company</h4>
            <Link to="/about">About us</Link>
            <Link to="/faq">FAQ &amp; help</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/register?role=owner">List your turf</Link>
            <Link to="/terms">Terms &amp; cancellation</Link>
            <Link to="/privacy">Privacy policy</Link>
          </div>
        </div>
        <div className="legal">
          <span>© {new Date().getFullYear()} TurfBook Kerala. All rights reserved.</span>
          <span>Maps © OpenStreetMap contributors</span>
        </div>
      </div>
    </footer>
  );
}
