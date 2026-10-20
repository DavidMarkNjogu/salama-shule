import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowLeft, ArrowRight, ListChecks } from "lucide-react";
import { Button } from "../components/Button";
import { useDeviceState } from "../helpers/useDeviceState";
import styles from "./lesson.$lessonId.module.css";

// Reads only from the copy saved on the device, so it works with no network.
export default function LessonPage() {
  const { lessonId } = useParams();
  const { unit } = useDeviceState();

  const index = unit ? unit.lessons.findIndex((l) => l.id === lessonId) : -1;
  const lesson = unit && index >= 0 ? unit.lessons[index] : null;

  if (!unit || !lesson) {
    return (
      <div className={styles.page}>
        <p className={styles.msg}>
          This lesson is not saved on the device yet. Open the home page while
          online to download your unit.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Back to study</Link>
        </Button>
      </div>
    );
  }

  const prev = index > 0 ? unit.lessons[index - 1] : null;
  const next = index < unit.lessons.length - 1 ? unit.lessons[index + 1] : null;

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{lesson.title} | Salama Shule</title>
      </Helmet>
      <p className={styles.crumb}>
        Lesson {index + 1} of {unit.lessons.length}
      </p>
      <h1 className={styles.title}>{lesson.title}</h1>
      <div className={styles.body}>
        {lesson.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className={styles.nav}>
        {prev ? (
          <Button asChild variant="outline">
            <Link to={`/lesson/${prev.id}`}>
              <ArrowLeft size={16} /> Previous
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft size={16} /> Back
            </Link>
          </Button>
        )}
        {next ? (
          <Button asChild>
            <Link to={`/lesson/${next.id}`}>
              Next <ArrowRight size={16} />
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/quiz">
              <ListChecks size={16} /> Take the quiz
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
