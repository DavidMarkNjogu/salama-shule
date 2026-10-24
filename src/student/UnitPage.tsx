import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDb } from '../lib/hooks';
import { fmtTime } from '../components';

export default function UnitPage() {
  const { id } = useParams();
  const db = useDb()!;
  const unit = useLiveQuery(async () => (await db.units.get(id!)) ?? false, [db, id]);
  const lessons = useLiveQuery(() => db.lessons.where('unitId').equals(id!).sortBy('position'), [db, id], []);
  const quizzes = useLiveQuery(() => db.assessments.where('unitId').equals(id!).toArray(), [db, id], []);
  const attempts = useLiveQuery(() => db.attempts.toArray(), [db], []);

  if (unit === undefined) return <p className="muted">Loading…</p>;
  if (unit === false) return <p className="muted">This unit isn't on your device. <Link to="/student">Download it first.</Link></p>;

  return (
    <>
      <Link to="/student" className="back">← All units</Link>
      <h1>{unit.title}</h1>
      <p className="muted">{unit.description} <span className="small">· Downloaded {fmtTime(unit.downloadedAt)}</span></p>

      <h2 className="section-title">Lessons</h2>
      <div className="list">
        {lessons?.map((l, i) => (
          <Link key={l.id} to={`/student/lesson/${l.id}`} className="list-item">
            <span className="num">{i + 1}</span>
            <span className="grow">{l.title}</span>
            <span className="small muted">{l.minutes} min</span>
          </Link>
        ))}
      </div>

      <h2 className="section-title">Quizzes & assessments</h2>
      <div className="grid">
        {quizzes?.map((q) => {
          const mine = (attempts ?? []).filter((a) => a.assessmentId === q.id && a.status !== 'in_progress');
          const inProgress = (attempts ?? []).some((a) => a.assessmentId === q.id && a.status === 'in_progress');
          return (
            <div className="card" key={q.id}>
              <span className={`badge ${q.mode === 'formal' ? 'st-warn' : 'st-synced'}`}>
                {q.mode === 'formal' ? 'Formal — graded by server' : 'Practice — instant feedback'}
              </span>
              <h3>{q.title}</h3>
              <p className="small muted">
                {q.questions.length} questions
                {q.timeLimitMin ? ` · ${q.timeLimitMin} min limit` : ''}
                {q.deadline ? ` · due ${fmtTime(q.deadline)}` : ''} · attempts {mine.length}/{q.maxAttempts}
              </p>
              <Link className="btn" to={`/student/quiz/${q.id}`}>{inProgress ? 'Resume' : mine.length ? 'Try again' : 'Start'}</Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
