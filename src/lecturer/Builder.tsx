import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type ApiError } from '../lib/api';

type Draft = { prompt: string; options: string[]; correctIndex: number; explanation: string };
const blankQ = (): Draft => ({ prompt: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' });

export default function Builder() {
  const nav = useNavigate();
  const [units, setUnits] = useState<{ id: string; title: string }[]>([]);
  const [unitId, setUnitId] = useState('');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'practice' | 'formal'>('practice');
  const [timeLimit, setTimeLimit] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxAttempts, setMaxAttempts] = useState('3');
  const [qs, setQs] = useState<Draft[]>([blankQ()]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/api/lecturer/overview').then((o) => { setUnits(o.units); setUnitId(o.units[0]?.id ?? ''); }).catch(() => setErr('Connect to the internet to build assessments.'));
  }, []);

  const upd = (i: number, patch: Partial<Draft>) => setQs(qs.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  async function save(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api('/api/lecturer/assessments', {
        body: {
          unitId, title, mode,
          timeLimitMin: timeLimit ? Number(timeLimit) : null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          maxAttempts: Number(maxAttempts) || 1,
          questions: qs.map((q) => {
            const options = q.options.map((o) => o.trim()).filter(Boolean);
            const correctText = q.options[q.correctIndex]?.trim();
            return { prompt: q.prompt, options, correctIndex: Math.max(0, options.indexOf(correctText)), explanation: q.explanation };
          })
        }
      });
      nav('/lecturer');
    } catch (e) {
      setErr((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="builder">
      <h1>Assessment builder</h1>
      <p className="muted">Students get new quizzes the next time they update the unit. Formal answer keys never leave the server.</p>
      {err && <div className="error">{err}</div>}
      <div className="card form-grid">
        <label>Unit<select value={unitId} onChange={(e) => setUnitId(e.target.value)}>{units.map((u) => <option key={u.id} value={u.id}>{u.title}</option>)}</select></label>
        <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. CAT 2 · Passwords" required /></label>
        <label>Mode
          <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
            <option value="practice">Practice — instant feedback, graded on device</option>
            <option value="formal">Formal — answers sealed, graded by server</option>
          </select>
        </label>
        <label>Time limit (minutes)<input type="number" min={1} value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} placeholder="none" /></label>
        <label>Deadline<input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></label>
        <label>Max attempts<input type="number" min={1} max={20} value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} /></label>
      </div>

      {qs.map((q, i) => (
        <div className="card" key={i}>
          <div className="row-between"><h3>Question {i + 1}</h3>{qs.length > 1 && <button type="button" className="btn-ghost small" onClick={() => setQs(qs.filter((_, j) => j !== i))}>Remove</button>}</div>
          <label>Question<textarea value={q.prompt} onChange={(e) => upd(i, { prompt: e.target.value })} required rows={2} /></label>
          {q.options.map((o, k) => (
            <div className="opt-row" key={k}>
              <input type="radio" name={`c${i}`} checked={q.correctIndex === k} onChange={() => upd(i, { correctIndex: k })} aria-label="Correct answer" />
              <input value={o} placeholder={`Option ${String.fromCharCode(65 + k)}${k < 2 ? '' : ' (optional)'}`} required={k < 2}
                onChange={(e) => upd(i, { options: q.options.map((x, j) => (j === k ? e.target.value : x)) })} />
            </div>
          ))}
          <p className="small muted">Select the radio button next to the correct answer.</p>
          <label>Explanation (shown after practice quizzes)<input value={q.explanation} onChange={(e) => upd(i, { explanation: e.target.value })} /></label>
        </div>
      ))}
      <div className="row">
        <button type="button" className="btn-ghost" onClick={() => setQs([...qs, blankQ()])}>+ Add question</button>
        <button className="btn" disabled={busy || !unitId}>{busy ? 'Publishing…' : 'Publish assessment'}</button>
      </div>
    </form>
  );
}
