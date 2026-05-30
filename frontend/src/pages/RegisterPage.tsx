import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AxiosError } from "axios";
import styles from "../styles/authPage.module.css";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "", passwordConfirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form.username, form.email, form.password, form.passwordConfirm);
      navigate("/");
    } catch (err) {
      const axiosErr = err as AxiosError<Record<string, string[]>>;
      const data = axiosErr.response?.data;
      setError(typeof data === "object" && data ? Object.values(data).flat().join(" ") : "Помилка реєстрації");
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
        <h1 className={styles.h1}>Створіть акаунт</h1>
        <p className={styles.subtitle}>Реєстрація займає менше хвилини</p>

        {error && <p className={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Ім'я користувача</span>
            <span className={styles.inputWrap}>
              <UserIcon size={16} className={styles.fieldIcon} />
              <input
                className={styles.input}
                name="username"
                placeholder="Ваш нік"
                value={form.username}
                onChange={handleChange}
                required
              />
            </span>
          </label>

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email</span>
            <span className={styles.inputWrap}>
              <Mail size={16} className={styles.fieldIcon} />
              <input
                className={styles.input}
                name="email"
                type="email"
                placeholder="ви@example.com"
                value={form.email}
                onChange={handleChange}
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
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Мінімум 8 символів"
                value={form.password}
                onChange={handleChange}
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

          <label className={styles.field}>
            <span className={styles.fieldLabel}>Підтвердити пароль</span>
            <span className={styles.inputWrap}>
              <Lock size={16} className={styles.fieldIcon} />
              <input
                className={styles.input}
                name="passwordConfirm"
                type={showPassword ? "text" : "password"}
                placeholder="Повторіть пароль"
                value={form.passwordConfirm}
                onChange={handleChange}
                required
              />
            </span>
          </label>

          <button type="submit" className={styles.btn} disabled={submitting}>
            {submitting ? "Створення..." : "Створити акаунт"}
          </button>
        </form>

        <p className={styles.linkText}>
          Вже є акаунт? <Link to="/login">Увійти</Link>
        </p>
      </div>
    </div>
  );
}
