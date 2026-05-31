import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AxiosError } from "axios";
import styles from "../styles/authPage.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
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

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>P</span>
          <span className={`${styles.brandText} gradient-text`}>Predictium</span>
        </div>
        <h1 className={styles.h1}>Ласкаво просимо</h1>
        <p className={styles.subtitle}>Увійдіть у свій акаунт, щоб продовжити</p>

        {error && <p className={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <span className={styles.inputWrap}>
              <Mail size={16} className={styles.fieldIcon} />
              <input
                className={styles.input}
                type="email"
                placeholder="ви@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </span>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Пароль</span>
            <span className={styles.inputWrap}>
              <Lock size={16} className={styles.fieldIcon} />
              <input
                className={styles.input}
                type={showPassword ? "text" : "password"}
                placeholder="Введіть пароль"
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
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </span>
          </label>

          <button type="submit" className={styles.btn} disabled={submitting}>
            {submitting ? "Вхід..." : "Увійти"}
          </button>
        </form>

        <p className={styles.linkText}>
          Немає акаунту? <Link to="/register">Зареєструватися</Link>
        </p>
      </div>
    </div>
  );
}
