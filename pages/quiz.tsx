import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Check, X, ArrowRight, Flag } from "lucide-react";
import { Button } from "../components/Button";
import { SyncChip } from "../components/SyncChip";
import { deviceStore } from "../helpers/deviceStore";
import { useDeviceState } from "../helpers/useDeviceState";
import styles from "./quiz.module.css";

const makeId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

// Fully on-device: questions come from the saved unit, each answer is saved the
// moment it is given, and the finished attempt joins the sync queue.
export default function QuizPage() {
  const { unit, profile, progress, attempts } = useDeviceState();
  const [finishedId, setFinishedId] = useState<string | null>(null);

  const quiz = unit?.quiz;
  if (!unit || !quiz || !profile) {
    return (
      <div className={styles.page}>
        <p className={styles.msg}>
          Your unit is not saved on this device yet. Open the home page while
          online first.
        </p>
        <Button asChild variant="outline">
          <Link to="/">Back to study</Link>
        </Button>
      </div>
    );
  }

  const total = quiz.questions.length;

  if (finishedId) {
    const attempt = attempts.find((a) => a.attemptId === finishedId);
    return (
      <div className={styles.page}>
        <Helmet>
          <title>Result | Salama Shule</title>
        </Helmet>
        <section className={styles.result}>
          <p className={styles.kicker}>Quiz complete</p>
          <p className={styles.bigScore}>
            {attempt?.score ?? 0}
            <span>/{total}</span>
          </p>
          {attempt && <SyncChip status={attempt.status} />}
          {attempt?.scoreCorrected && (
            <p className={styles.msg}>
              The server re-marked this attempt from your saved answers and
              recorded {attempt.score}/{attempt.total}. This phone showed{" "}
              {attempt.deviceScore}/{attempt.total}.
            </p>
          )}
          <p className={styles.msg}>
            Your answers are saved on this device. They are sent to your lecturer
            automatically, and show Synced only after the server confirms.
          </p>
          <div className={styles.telemetryCard}>
            <p className={styles.telemetryTitle}>Zero-Trust Integrity Telemetry</p>
            <p className={styles.telemetryText}>
              Device Queue ID: <code>{attempt ? attempt.attemptId.slice(0, 18) : "queue-pending"}...</code>
            </p>
            <p className={styles.telemetryText}>
              Audit Protocol: Server independently grades raw answers on receipt (client score is a claim, not truth).
            </p>
          </div>
          <div className={styles.row}>
            <Button asChild>
              <Link to="/">Back to study</Link>
            </Button>
            <Button variant="outline" onClick={() => setFinishedId(null)}>
              Retake
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const active = progress && progress.quizId === quiz.id ? progress : null;

  if (!active) {
    return (
      <div className={styles.page}>
        <Helmet>
          <title>{quiz.title} | Salama Shule</title>
        </Helmet>
        <section className={styles.result}>
          <p className={styles.kicker}>Practice quiz</p>
          <h1 className={styles.title}>{quiz.title}</h1>
          <p className={styles.msg}>
            {total} multiple-choice questions, marked instantly on your phone.
            Each answer is saved as you give it, so closing the app or losing
            the network does not lose your progress.
          </p>
          <Button
            size="lg"
            onClick={() =>
              deviceStore.saveProgress({
                quizId: quiz.id,
                answers: quiz.questions.map(() => -1),
                index: 0,
              })
            }
          >
            Start quiz
          </Button>
        </section>
      </div>
    );
  }

  const index = Math.min(active.index, total - 1);
  const q = quiz.questions[index];
  const chosen = active.answers[index];
  const answered = chosen !== -1;
  const isLast = index === total - 1;

  const choose = (i: number) => {
    if (answered) return;
    const answers = [...active.answers];
    answers[index] = i;
    deviceStore.saveProgress({ quizId: quiz.id, answers, index });
  };

  const advance = () => {
    if (!isLast) {
      deviceStore.saveProgress({ ...active, index: index + 1 });
      return;
    }
    const score = quiz.questions.reduce(
      (n, qu, k) => n + (active.answers[k] === qu.correctIndex ? 1 : 0),
      0,
    );
    const attemptId = makeId();
    deviceStore.addAttempt({
      attemptId,
      studentCode: profile.code,
      joinCode: profile.joinCode,
      studentName: profile.name,
      unitId: unit.id,
      quizId: quiz.id,
      score,
      total,
      answers: active.answers,
      clientTime: new Date().toISOString(),
      status: "saved",
    });
    deviceStore.clearProgress();
    setFinishedId(attemptId);
  };

  return (
    <div className={styles.page}>
      <Helmet>
        <title>{quiz.title} | Salama Shule</title>
      </Helmet>
      <div className={styles.progressRow}>
        <span className={styles.kicker}>
          Question {index + 1} of {total}
        </span>
        <span className={styles.saved}>Answer saved on device</span>
      </div>
      <div className={styles.bar} aria-hidden="true">
        <div
          className={styles.barFill}
          style={{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <h1 className={styles.question}>{q.text}</h1>

      <div className={styles.options} role="radiogroup" aria-label="Answers">
        {q.options.map((opt, i) => {
          const isChosen = chosen === i;
          const isCorrect = answered && i === q.correctIndex;
          const isWrong = answered && isChosen && i !== q.correctIndex;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isChosen}
              disabled={answered}
              onClick={() => choose(i)}
              className={`${styles.option} ${isCorrect ? styles.correct : ""} ${
                isWrong ? styles.wrong : ""
              } ${isChosen && !answered ? styles.picked : ""}`}
            >
              <span className={styles.letter}>
                {isCorrect ? (
                  <Check size={16} />
                ) : isWrong ? (
                  <X size={16} />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <p className={styles.explain}>
          {chosen === q.correctIndex ? "Correct. " : "Not quite. "}
          {q.explanation}
        </p>
      )}

      <Button size="lg" disabled={!answered} onClick={advance}>
        {isLast ? (
          <>
            <Flag size={18} /> Finish quiz
          </>
        ) : (
          <>
            Next question <ArrowRight size={18} />
          </>
        )}
      </Button>
    </div>
  );
}
