import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "./Input";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import styles from "./PasswordLoginForm.module.css";
import {
  schema,
  postLogin,
} from "../endpoints/auth/login_with_password_POST.schema";
import { useAuth } from "../helpers/useAuth";

export const PasswordLoginForm: React.FC<{ className?: string }> = ({
  className,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { onLogin } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setIsLoading(true);
    try {
      const result = await postLogin(parsed.data);
      onLogin(result.user);
      setTimeout(() => navigate("/lecturer"), 200);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      noValidate
      className={`${styles.form} ${className || ""}`}
    >
      {error && <div className={styles.errorMessage}>{error}</div>}
      <label className={styles.field}>
        <span className={styles.label}>Email</span>
        <Input
          type="email"
          placeholder="your@email.com"
          autoComplete="email"
          disabled={isLoading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Password</span>
        <Input
          type="password"
          autoComplete="current-password"
          disabled={isLoading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <Button type="submit" disabled={isLoading} className={styles.submitButton}>
        {isLoading ? (
          <span className={styles.loadingText}>
            <Spinner className={styles.spinner} size="sm" />
            Logging in...
          </span>
        ) : (
          "Log In"
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={styles.demoBtn}
        disabled={isLoading}
        onClick={() => {
          setEmail("lecturer@salama.ac.ke");
          setPassword("lecturer123");
        }}
      >
        Use demo credentials
      </Button>
    </form>
  );
};
