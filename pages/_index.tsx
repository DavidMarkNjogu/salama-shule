import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useMutation } from "@tanstack/react-query";
import {
  BookOpen,
  ListChecks,
  DownloadCloud,
  CheckCircle2,
  UserRound,
} from "lucide-react";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { SyncChip } from "../components/SyncChip";
import { JoinCodeEditor } from "../components/JoinCodeEditor";
import { deviceStore } from "../helpers/deviceStore";
import { useDeviceState } from "../helpers/useDeviceState";
import { useNetwork } from "../helpers/useNetwork";
import { getUnit } from "../endpoints/units/get_GET.schema";
import { SAMPLE_UNIT } from "../helpers/unitContent";
import { postJoinCheck } from "../endpoints/classes/join_POST.schema";
import styles from "./_index.module.css";

export default function HomePage() {
  const { profile, unit, unitSavedAt, attempts } = useDeviceState();
  const { online } = useNetwork();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const download = useMutation({
    mutationFn: async () => {
      try {
        return await getUnit();
      } catch {
        return { unit: SAMPLE_UNIT };
      }
    },
    onSuccess: (res) => deviceStore.cacheUnit(res.unit),
  });

  // First online visit: save the unit on the device automatically.
  const { mutate: autoDownload } = download;
  useEffect(() => {
    if (profile && !unit && online) autoDownload();
  }, [profile, unit, online, autoDownload]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const c = code.trim();
    const j = joinCode.trim().toUpperCase();
    if (!n || !c || j.length < 3) return;
    setJoinError(null);
    if (online) {
      setChecking(true);
      try {
        const res = await postJoinCheck({ joinCode: j });
        if (!res.valid) {
          setJoinError("That class code was not recognised. Ask your lecturer.");
          return;
        }
      } catch {
        // Could not check right now. It is checked again when results sync.
      } finally {
        setChecking(false);
      }
    }
    deviceStore.setProfile({ name: n, code: c, joinCode: j });
  };

  if (!profile) {
    return (
      <div className={styles.page}>
        <Helmet>
          <title>Salama Shule: study and quiz without losing progress</title>
        </Helmet>
        <section className={styles.welcome}>
          <p className={styles.eyebrow}>Offline-first learning</p>
          <h1 className={styles.title}>
            Study and take quizzes, even when the network drops.
          </h1>
          <p className={styles.lede}>
            Open a unit once while you have data. Your lessons and quiz are saved
            on this phone. Answers are saved as you go and sent to your lecturer
            when you are back online.
          </p>
          <form className={styles.card} onSubmit={saveProfile}>
            <h2 className={styles.h2}>
              <UserRound size={20} /> Who is studying?
            </h2>
            <label className={styles.field}>
              <span>Your name</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wanjiku Kamau"
                maxLength={120}
              />
            </label>
            <label className={styles.field}>
              <span>Student code</span>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. SC/1042/24"
                maxLength={40}
              />
            </label>
            <label className={styles.field}>
              <span>Class code</span>
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="From your lecturer, e.g. SAFE-2026"
                maxLength={40}
              />
            </label>
            {joinError && <p className={styles.error}>{joinError}</p>}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={styles.demoBtn}
              onClick={() => {
                setName("Amina Wanjiku");
                setCode("SC/1042/24");
                setJoinCode("SAFE-2026");
              }}
            >
              Fill demo details (SAFE-2026)
            </Button>
            <p className={styles.hint}>
              No password. Your name, student code and class code are remembered
              on this device. The class code tells the server which class your
              results belong to.
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={
                checking ||
                !name.trim() ||
                !code.trim() ||
                joinCode.trim().length < 3
              }
            >
              {checking ? "Checking class code..." : "Start learning"}
            </Button>
          </form>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Study | Salama Shule</title>
      </Helmet>

      <h1 className={styles.greeting}>Habari, {profile.name.split(" ")[0]}</h1>
      <p className={styles.sub}>
        Student code <span className={styles.mono}>{profile.code}</span>
      </p>
      <JoinCodeEditor />

      {!unit ? (
        <section className={styles.card}>
          <h2 className={styles.h2}>
            <DownloadCloud size={20} /> Get your unit
          </h2>
          {download.isPending ? (
            <div className={styles.skeleton} aria-label="Downloading" />
          ) : (
            <>
              <p className={styles.hint}>
                {online
                  ? "Download the unit once. It will open with no network after that."
                  : "You are offline. Connect once to download your unit."}
              </p>
              {download.isError && (
                <p className={styles.error}>
                  Download failed. Check your connection and try again.
                </p>
              )}
              <Button onClick={() => download.mutate()} disabled={!online}>
                Download for offline
              </Button>
            </>
          )}
        </section>
      ) : (
        <section className={styles.card}>
          <div className={styles.unitHead}>
            <div>
              <h2 className={styles.unitTitle}>{unit.title}</h2>
              <p className={styles.hint}>{unit.description}</p>
            </div>
            <span className={styles.saved}>
              <CheckCircle2 size={15} /> Saved on device
            </span>
          </div>
          {unitSavedAt && (
            <p className={styles.fine}>
              Downloaded {new Date(unitSavedAt).toLocaleString()}. Opens with no
              network.
            </p>
          )}

          <ul className={styles.lessons}>
            {unit.lessons.map((l, i) => (
              <li key={l.id}>
                <Link to={`/lesson/${l.id}`} className={styles.lesson}>
                  <BookOpen size={18} strokeWidth={1.7} />
                  <span>
                    <span className={styles.lessonNum}>Lesson {i + 1}</span>
                    {l.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Button asChild size="lg" className={styles.quizBtn}>
            <Link to="/quiz">
              <ListChecks size={18} /> {unit.quiz.title}
            </Link>
          </Button>
        </section>
      )}

      <section className={styles.card}>
        <h2 className={styles.h2}>Your results</h2>
        {attempts.length === 0 ? (
          <p className={styles.hint}>
            No attempts yet. Finish the quiz and your result appears here with
            its sync status.
          </p>
        ) : (
          <ul className={styles.attempts}>
            {attempts.map((a) => (
              <li key={a.attemptId} className={styles.attempt}>
                <div>
                  <p className={styles.score}>
                    {a.score}/{a.total}
                  </p>
                  <p className={styles.fine}>
                    {new Date(a.clientTime).toLocaleString()}
                  </p>
                  {a.scoreCorrected && (
                    <p className={styles.fine}>
                      Server score. This phone showed {a.deviceScore}/{a.total}.
                    </p>
                  )}
                  {a.rejected && (
                    <p className={styles.errorSmall}>
                      Not accepted: {a.error}
                    </p>
                  )}
                  {!a.rejected && !a.joinCode && a.status === "saved" && (
                    <p className={styles.errorSmall}>
                      Add your class code above to send this result.
                    </p>
                  )}
                  {a.error && a.status === "saved" && !a.rejected && a.joinCode && (
                    <p className={styles.errorSmall}>
                      Last send failed. It will retry automatically.
                    </p>
                  )}
                </div>
                <SyncChip status={a.status} />
              </li>
            ))}
          </ul>
        )}
        <p className={styles.fine}>
          Results show Synced only after the server confirms receipt.
        </p>
      </section>
    </div>
  );
}
