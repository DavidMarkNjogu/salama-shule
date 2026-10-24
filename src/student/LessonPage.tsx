import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDb } from '../lib/hooks';
import { LessonBlocks } from '../components';

export default function LessonPage() {
  const { id } = useParams();
  const db = useDb()!;
  const lesson = useLiveQuery(() => db.lessons.get(id!), [db, id], null);
  const siblings = useLiveQuery(async () => {
    if (!lesson) return [];
    return db.lessons.where('unitId').equals(lesson.unitId).sortBy('position');
  }, [db, lesson], []);

  if (lesson === null) return <p className="muted">Loading…</p>;
  if (!lesson) return <p className="muted">Lesson not on this device.</p>;
  const idx = siblings?.findIndex((l) => l.id === lesson.id) ?? -1;
  const next = idx >= 0 ? siblings?.[idx + 1] : undefined;

  return (
    <article className="lesson">
      <Link to={`/student/unit/${lesson.unitId}`} className="back">← Back to unit</Link>
      <p className="eyebrow">Lesson {idx + 1} · {lesson.minutes} min read · stored on this device</p>
      <h1>{lesson.title}</h1>
      <LessonBlocks blocks={lesson.blocks} />
      <div className="row-between lesson-nav">
        <span />
        {next ? <Link className="btn" to={`/student/lesson/${next.id}`}>Next: {next.title} →</Link>
              : <Link className="btn" to={`/student/unit/${lesson.unitId}`}>Go to quizzes →</Link>}
      </div>
    </article>
  );
}
