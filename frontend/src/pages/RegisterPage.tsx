import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import GoogleButton from "../components/auth/GoogleButton";
import FacebookButton from "../components/auth/FacebookButton";
import styles from "../styles/authPage.module.css";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register, loginWithGoogle, loginWithFacebook } = useAuth();
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
      setError(
        typeof data === "object" && data
          ? Object.values(data).flat().join(" ")
          : "Помилка реєстрації"
      );
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

  const handleFacebookSuccess = async (accessToken: string) => {
    setError("");
    setSubmitting(true);
    try {
      await loginWithFacebook(accessToken);
      navigate("/");
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setError(axiosErr.response?.data?.detail || "Не вдалось увійти через Facebook");
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
          <h1 className={styles.heading}>Створити акаунт</h1>
          <p className={styles.subtitle}>Приєднуйтесь до платформи Predictium</p>

          {error && <p className={styles.error}>{error}</p>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="reg-username">
                Ім'я / Юзернейм
              </label>
              <input
                id="reg-username"
                name="username"
                type="text"
                className={styles.input}
                placeholder="Predictor123"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="reg-email">
                Email
              </label>
              <input
                id="reg-email"
                name="email"
                type="email"
                className={styles.input}
                placeholder="your@email.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="reg-password">
                  Пароль
                </label>
                <div className={styles.inputWrap}>
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    className={`${styles.input} ${styles.inputWithEye}`}
                    placeholder="••••••••"
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
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="reg-password-confirm">
                  Повторіть
                </label>
                <div className={styles.inputWrap}>
                  <input
                    id="reg-password-confirm"
                    name="passwordConfirm"
                    type={showConfirmPassword ? "text" : "password"}
                    className={`${styles.input} ${styles.inputWithEye}`}
                    placeholder="••••••••"
                    value={form.passwordConfirm}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={
                      showConfirmPassword ? "Сховати пароль" : "Показати пароль"
                    }
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.termsRow}>
              <input
                id="reg-terms"
                type="checkbox"
                className={styles.checkbox}
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <label className={styles.termsText} htmlFor="reg-terms">
                Я згоден з{" "}
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Правилами користування
                </a>{" "}
                та{" "}
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Політикою конфіденційності
                </a>
              </label>
            </div>

            <button
              type="submit"
              className={`${styles.submitBtn} ${styles.submitBtnRegister}`}
              disabled={submitting}
            >
              {submitting ? "Створення..." : "Створити акаунт"}
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
            <FacebookButton
              onSuccess={handleFacebookSuccess}
              onError={setError}
              disabled={submitting}
            />
          </div>

          <p className={`${styles.footerLink} ${styles.footerLinkBlue}`}>
            Вже є акаунт? <Link to="/login">Увійти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
