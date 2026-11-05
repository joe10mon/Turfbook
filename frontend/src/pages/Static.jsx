import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Empty, PageHero, SectionTitle } from '../components/ui';
import { errMsg } from '../utils';

/* ------------------------------------------------------------------ About */
export function About() {
  return (
    <>
      <PageHero title="About TurfBook Kerala" subtitle="Making it effortless to find a ground and get a game going." />
      <section className="section">
        <div className="container grid grid-2" style={{ alignItems: 'center', gap: '3rem' }}>
          <div>
            <span className="eyebrow">Our story</span>
            <h2>Kerala plays hard. Booking shouldn't.</h2>
            <p>
              Football, box cricket and badminton are woven into weekends across Kerala, yet booking a ground still means phone tags,
              WhatsApp screenshots and double-booked slots. TurfBook puts every venue on one map with live availability.
            </p>
            <p>
              Players see real hours and real prices. Owners get a simple dashboard that keeps the calendar full and the cash flow clear.
            </p>
            <Link to="/turfs" className="btn btn-green">Find a turf</Link>
          </div>
          <img src="/img/turfs/football-dusk.svg" alt="Illustration of a floodlit football pitch at dusk" style={{ borderRadius: 6, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--green-900)' }} />
        </div>
      </section>
      <section className="section alt">
        <div className="container">
          <SectionTitle eyebrow="What we stand for" title="Our principles" />
          <div className="grid grid-3">
            {[
              ['Transparent', 'Hourly prices, weekend rates and cancellation rules are always shown before you book.'],
              ['Local first', 'Built around Kerala\'s 14 districts, from city arenas to hill-town grounds.'],
              ['Fair to owners', 'Owners set their own rates and manage their own calendars and payouts.'],
            ].map(([t, d]) => (
              <div className="card card-pad" key={t}><h3>{t}</h3><p className="muted" style={{ marginBottom: 0 }}>{d}</p></div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ---------------------------------------------------------------- Contact */
export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [state, setState] = useState({ busy: false, ok: '', err: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, ok: '', err: '' });
    try {
      const { data } = await api.post('/contact/', form);
      setState({ busy: false, ok: data.detail, err: '' });
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) { setState({ busy: false, ok: '', err: errMsg(err) }); }
  };

  return (
    <>
      <PageHero title="Contact us" subtitle="Questions about a booking or listing a turf? We reply within one working day." />
      <div className="container grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', padding: '2.5rem 0 4rem', gap: '2rem' }}>
        <div>
          <h2>Get in touch</h2>
          <p className="muted">Replace these placeholder details with your own before launch.</p>
          <div className="card card-pad" style={{ marginBottom: '1rem' }}><strong>Support line</strong><br />+91 80000 00000 · 7 AM – 10 PM</div>
          <div className="card card-pad" style={{ marginBottom: '1rem' }}><strong>Email</strong><br />hello@turfbook.example</div>
          <div className="card card-pad"><strong>Office</strong><br />Kochi, Kerala, India</div>
        </div>
        <form className="card card-pad" onSubmit={submit}>
          {state.ok && <div className="alert ok">{state.ok}</div>}
          {state.err && <div className="alert err">{state.err}</div>}
          <div className="row">
            <div className="field"><label className="f" htmlFor="cn">Name</label><input id="cn" required value={form.name} onChange={set('name')} /></div>
            <div className="field"><label className="f" htmlFor="ce">Email</label><input id="ce" type="email" required value={form.email} onChange={set('email')} /></div>
          </div>
          <div className="field"><label className="f" htmlFor="cs">Subject</label><input id="cs" value={form.subject} onChange={set('subject')} /></div>
          <div className="field"><label className="f" htmlFor="cm">Message</label><textarea id="cm" required maxLength={3000} value={form.message} onChange={set('message')} /></div>
          <button className="btn btn-green" disabled={state.busy}>{state.busy ? 'Sending…' : 'Send message'}</button>
        </form>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------- FAQ */
const FAQS = [
  ['How do I book a turf?', 'Open any turf, choose a date and one or more consecutive hours, then continue to checkout. You will get a booking code instantly.'],
  ['Can I cancel a booking?', 'Yes. You can cancel up to 2 hours before the start time from My bookings. Paid amounts are marked refunded.'],
  ['Can I book more than one hour?', 'Yes, up to 6 consecutive hours in a single booking. For non-adjacent times, make separate bookings.'],
  ['Are weekend prices different?', 'Owners can set a separate Saturday and Sunday rate. The price is shown on the turf page and in your checkout summary.'],
  ['How do I find turfs near me?', 'On the Find a turf page, tap "Turfs near me" and allow location access. Results are sorted by distance.'],
  ['How do I list my turf?', 'Create an owner account, open your dashboard, and choose Add turf. Drop a pin on the map, set rates and hours, and publish.'],
  ['Is online payment live?', 'The checkout in this build is a demo: UPI and card bookings are marked paid without charging. A payment gateway must be connected before real use.'],
];

export function FAQ() {
  return (
    <>
      <PageHero title="Help & FAQ" subtitle="Quick answers to common questions." crumb="FAQ" />
      <div className="container prose" style={{ padding: '2.5rem 0 4rem' }}>
        {FAQS.map(([q, a]) => (
          <details className="faq" key={q}><summary>{q}</summary><div>{a}</div></details>
        ))}
        <p className="center" style={{ marginTop: '2rem' }}>Still stuck? <Link to="/contact">Contact us</Link>.</p>
      </div>
    </>
  );
}

/* ---------------------------------------------------------- Terms/Privacy */
export function Terms() {
  return (
    <>
      <PageHero title="Terms & cancellation" subtitle="Template text: have it reviewed by a lawyer before launch." crumb="Terms" />
      <div className="container prose" style={{ padding: '2.5rem 0 4rem' }}>
        <h2>Bookings</h2>
        <p>A booking is confirmed once you receive a booking code. Slots are held for the booked hours only; late arrival does not extend the session.</p>
        <h2>Cancellation &amp; refunds</h2>
        <p>Players may cancel up to 2 hours before the start time. Prepaid bookings are refunded to the original payment method. Cancellations inside 2 hours are not available online; contact the turf directly.</p>
        <h2>Turf rules</h2>
        <p>Players must follow each venue's rules, including footwear, equipment and conduct. Owners may refuse entry for unsafe behaviour or damage to the property.</p>
        <h2>Owner listings</h2>
        <p>Owners are responsible for the accuracy of listings, pricing, availability and facilities, and for honouring confirmed bookings.</p>
        <h2>Liability</h2>
        <p>Sport carries risk of injury. TurfBook is a booking platform and is not responsible for injuries or losses at the venue, except where the law requires otherwise.</p>
      </div>
    </>
  );
}

export function Privacy() {
  return (
    <>
      <PageHero title="Privacy policy" subtitle="Template text: have it reviewed by a lawyer before launch." crumb="Privacy" />
      <div className="container prose" style={{ padding: '2.5rem 0 4rem' }}>
        <h2>What we collect</h2>
        <p>Account details (name, email, mobile), booking history and, if you choose "Turfs near me", your device location, which is used in your browser to sort results and is not stored.</p>
        <h2>How we use it</h2>
        <p>To confirm bookings, show your history, let turf owners contact players about a booking, and respond to support requests.</p>
        <h2>Sharing</h2>
        <p>Your name and mobile number are shared with the owner of a turf you book. We do not sell personal data.</p>
        <h2>Maps</h2>
        <p>Map tiles are provided by OpenStreetMap contributors. Place search while listing a turf uses OpenStreetMap Nominatim.</p>
        <h2>Your choices</h2>
        <p>You can update your profile at any time. Contact us to request deletion of your account.</p>
      </div>
    </>
  );
}

export function NotFound() {
  return (
    <div className="container" style={{ padding: '3rem 0' }}>
      <Empty icon="🥅" title="Offside! That page doesn't exist.">
        <Link to="/" className="btn btn-green">Back to home</Link>
      </Empty>
    </div>
  );
}
