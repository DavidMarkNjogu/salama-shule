import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { getDb } from './lib/localdb';
import { syncNow } from './lib/sync';
import { Logo, OnlinePill } from './components';
import type { ApiError } from './lib/api';

const DEMO = [
  { label: 'Student · Amina', email: 'amina@salama.ac.ke', pw: 'amina123' },
  { label: 'Student · Brian', email: 'brian@salama.ac.ke', pw: 'brian123' },
  { label: 'Lecturer · Dr. Mwangi', email: 'lecturer@salama.ac.ke', pw: 'lecturer123' }
];

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(email, password);
      if (u.role === 'student') syncNow(getDb(u.id), { force: true }); // send anything waiting for sign-in
      nav(u.role === 'student' ? '/student' : '/lecturer');
    } catch (err) {
      const e = err as ApiError;
      setError(e.kind === 'network' ? 'You need a connection to sign in the first time.' : e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="login-hero">
        <Logo size={56} />
        <h1>Salama Shule</h1>
        <p>Keep learning without a steady connection. Your work is saved on your device and delivered safely when you're back online.</p>
      </div>
      <form className="card login-card" onSubmit={submit}>
        <div className="row-between"><h2>Sign in</h2><OnlinePill /></div>
        <label>Email<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Password
          <span className="input-action">
            <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="input-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </span>
        </label>
        {error && <div className="error">{error}</div>}
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <div className="demo">
          <span className="muted small">Demo accounts</span>
          <span className="muted small">Select an account to fill the form.</span>
          <div className="chips">
            {DEMO.map((d) => (
              <button type="button" key={d.email} className="chip" onClick={() => { setEmail(d.email); setPassword(d.pw); }}>{d.label}</button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
