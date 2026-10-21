import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { PasswordLoginForm } from "../components/PasswordLoginForm";
import styles from "./login.module.css";

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <Helmet>
        <title>Lecturer sign in | Salama Shule</title>
      </Helmet>
      <section className={styles.card}>
        <p className={styles.kicker}>
          <ShieldCheck size={16} /> Lecturers only
        </p>
        <h1 className={styles.title}>Sign in to see class results</h1>
        <p className={styles.lede}>
          Students do not need an account. They join with their name, student
          code and the class code from the lecturer.
        </p>
        <PasswordLoginForm />
        <p className={styles.fine}>
          <Link to="/" className={styles.back}>
            Back to study
          </Link>
        </p>
      </section>
    </div>
  );
}
