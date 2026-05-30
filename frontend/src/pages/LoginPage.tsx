import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import GoogleButton from "../components/auth/GoogleButton";
import FacebookButton from "../components/auth/FacebookButton";
import styles from "../styles/authPage.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setError(axiosErr.response?.data?.detail || "Помилка входу");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (accessToken: string) => {
    setError("");
    setSubmitting(true);
    try {
      await loginWithGoogle(accessToken);
      navigate("/");
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setError(axiosErr.response?.data?.detail || "Не вдалось увійти через Google");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.glowBlue} />
        <div className={styles.glowPurple} />

        <div className={styles.card}>
          <h1 className={styles.heading}>Вітаємо знову</h1>
          <p className={styles.subtitle}>Увійдіть у свій акаунт, щоб продовжити</p>

          {error && <p className={styles.error}>{error}</p>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="login-email">
                Email або Юзернейм
              </label>
              <div className={styles.inputWrap}>
                <input
                  id="login-email"
                  type="email"
                  className={styles.input}
                  placeholder="введіть email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel} htmlFor="login-password">
                  Пароль
                </label>
                <a
                  href="#"
                  className={styles.forgotLink}
                  onClick={(e) => e.preventDefault()}
                >
                  Забули пароль?
                </a>
              </div>
              <div className={styles.inputWrap}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className={`${styles.input} ${styles.inputWithEye}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.rememberRow}>
              <input
                id="login-remember"
                type="checkbox"
                className={styles.checkbox}
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label className={styles.rememberLabel} htmlFor="login-remember">
                Запам'ятати мене
              </label>
            </div>

            <button
              type="submit"
              className={`${styles.submitBtn} ${styles.submitBtnLogin}`}
              disabled={submitting}
            >
              {submitting ? "Вхід..." : "Увійти"}
              <ArrowRight size={16} className={styles.submitArrow} />
            </button>
          </form>

          <div className={styles.dividerWrap}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>— або —</span>
          </div>

          <div className={styles.socialColumn}>
            <GoogleButton
              onSuccess={handleGoogleSuccess}
              onError={setError}
              disabled={submitting}
            />
            <FacebookButton disabled={submitting} />
          </div>

          <p className={styles.footerLink}>
            Ще немає акаунту? <Link to="/register">Зареєструватися</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
