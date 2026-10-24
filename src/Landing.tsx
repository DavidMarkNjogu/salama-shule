import { Link } from 'react-router-dom';
import { Logo } from './components';

function Icon({ type }: { type: 'offline' | 'quiz' | 'sync' | 'secure' }) {
  const content = {
    offline: <><path d="M12 18h8" /><path d="M4 18h4" /><path d="M6 14h12" /><path d="M8 10h8" /><path d="M10 6h4" /></>,
    quiz: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="m8 13 2 2 5-5" /><path d="M8 7h8" /></>,
    sync: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M6.5 9A7 7 0 0 1 20 12" /><path d="M17.5 15A7 7 0 0 1 4 12" /></>,
    secure: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v2" /></>
  };
  return <svg className="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{content[type]}</svg>;
}

const features = [
  ['offline', 'Learn Offline', 'Access lessons saved on your device without an active internet connection.'],
  ['quiz', 'Assess Anywhere', 'Complete supported quizzes offline, with attempts stored locally until sync is possible.'],
  ['sync', 'Automatic Sync', 'Queued attempts submit when connectivity returns, with clear and honest statuses.'],
  ['secure', 'Secure Learning', 'Authenticated access, role-based permissions, and careful handling of learning data.']
] as const;

export default function Landing() {
  return <div className="landing">
    <header className="landing-nav">
      <a className="landing-brand" href="#home"><Logo size={34} /><span>Salama Shule</span></a>
      <nav aria-label="Main navigation"><a href="#home">Home</a><a href="#features">Features</a><a href="#how-it-works">How It Works</a><a href="#security">Security</a></nav>
      <div className="landing-actions"><Link className="btn-ghost small" to="/login">Log in</Link><Link className="btn small" to="/login">Get started</Link></div>
    </header>
    <main>
      <section className="landing-hero" id="home">
        <div className="hero-copy"><span className="eyebrow">Offline-first learning for real-world connectivity</span><h1>Learning That Never Stops.</h1><p>Access lessons, complete assessments, and keep learning even when your internet connection doesn't cooperate.</p><div className="hero-actions"><Link className="btn" to="/login">Get started</Link><a className="btn-ghost" href="#features">Explore features</a></div><p className="hero-note">Your work is saved on your device first, then delivered when you reconnect.</p></div>
        <div className="hero-panel" aria-label="Offline learning status"><div className="hero-panel-top"><span>Learning workspace</span><span className="status-dot">Online</span></div><div className="hero-progress"><span>Unit 1: Cyber Hygiene</span><b>Ready offline</b><div><i /></div></div><div className="hero-row"><span>Lessons available</span><strong>3</strong></div><div className="hero-row"><span>Assessments ready</span><strong>2</strong></div><div className="hero-row"><span>Last sync</span><strong>Just now</strong></div><div className="hero-status">Saved locally. Syncs automatically when you reconnect.</div></div>
      </section>
      <section className="landing-section" id="features"><div className="section-heading"><span className="eyebrow">Built for continuity</span><h2>Everything you need to keep moving forward</h2><p>Simple tools for students and lecturers, designed around unreliable connectivity instead of assuming it away.</p></div><div className="landing-grid feature-grid">{features.map(([icon, title, text]) => <article className="landing-card" key={title}><div className="icon-wrap"><Icon type={icon} /></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className="landing-section steps-section" id="how-it-works"><div className="section-heading"><span className="eyebrow">A clear path from class to confirmation</span><h2>How it works</h2></div><div className="landing-grid steps-grid"><article className="step-card"><span className="step-number">01</span><h3>Connect and prepare</h3><p>Sign in, join a class using your lecturer's code, and download available learning materials.</p></article><article className="step-card"><span className="step-number">02</span><h3>Learn anywhere</h3><p>Read saved lessons and complete supported assessments even when the internet is unavailable.</p></article><article className="step-card"><span className="step-number">03</span><h3>Reconnect and sync</h3><p>When connectivity returns, queued attempts are submitted and clearly marked saved, syncing, synced, or needing attention.</p></article></div></section>
      <section className="landing-section security-section" id="security"><div className="security-copy"><span className="eyebrow">Designed with responsibility</span><h2>Security that supports trust</h2><p>Salama Shule uses authenticated access, student and lecturer permissions, server-side validation, and careful handling of assessment submissions.</p><p>The platform does not claim to be tamper-proof. Device timestamps can be wrong, so suspicious timelines are flagged for lecturer review rather than silently trusted.</p></div><div className="security-list"><div><b>Authenticated access</b><span>Sessions and role checks protect each portal.</span></div><div><b>Server-side grading</b><span>Formal assessments are re-graded by the server.</span></div><div><b>Honest sync states</b><span>Synced appears only after server confirmation.</span></div></div></section>
      <section className="landing-section portal-section"><div className="section-heading"><span className="eyebrow">One platform, two focused experiences</span><h2>Start where you are</h2></div><div className="landing-grid portal-grid"><article className="portal-card"><div className="portal-label">Student portal</div><h3>Learn with confidence</h3><p>Join classes, access materials, complete assessments, view results, and track progress from one calm workspace.</p><Link className="btn" to="/login">Student portal</Link></article><article className="portal-card"><div className="portal-label">Lecturer portal</div><h3>See learning clearly</h3><p>Manage classes, create assessments, configure rules, review submissions, and monitor performance.</p><Link className="btn-ghost" to="/login">Lecturer portal</Link></article></div></section>
      <section className="landing-cta"><div><span className="eyebrow">Keep your momentum</span><h2>Your learning shouldn't depend on your connection.</h2><p>Join Salama Shule and continue learning, even when connectivity is limited.</p></div><Link className="btn landing-cta-button" to="/login">Get started</Link></section>
    </main>
    <footer className="landing-footer"><div><a className="landing-brand" href="#home"><Logo size={30} /><span>Salama Shule</span></a><p>Offline-first learning and secure assessment for students and lecturers.</p></div><div className="footer-links"><a href="#features">Features</a><a href="#security">Security</a><a href="#home">Help</a><a href="#security">Privacy policy</a><a href="#security">Terms of use</a></div><small>Copyright 2026 Salama Shule</small></footer>
  </div>;
}
