import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AxiosError } from "axios";
import styles from "../styles/authPage.module.css";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", email: "", password: "", passwordConfirm: "" });
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register(form.username, form.email, form.password, form.passwordConfirm);
      navigate("/");
    } catch (err) {
      const axiosErr = err as AxiosError<Record<string, string[]>>;
      const data = axiosErr.response?.data;
      setError(typeof data === "object" && data ? Object.values(data).flat().join(" ") : "Помилка реєстрації");
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>P</div>
        </div>
        <h1 className={styles.h1}>Реєстрація</h1>
        <p className={styles.subtitle}>Створіть акаунт на Predictium</p>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input className={styles.input} name="username" placeholder="Ім'я користувача" value={form.username} onChange={handleChange} required />
          <input className={styles.input} name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
          <input className={styles.input} name="password" type="password" placeholder="Пароль (мін. 8 символів)" value={form.password} onChange={handleChange} required />
          <input className={styles.input} name="passwordConfirm" type="password" placeholder="Підтвердити пароль" value={form.passwordConfirm} onChange={handleChange} required />
          <button type="submit" className={styles.btn}>Створити акаунт</button>
        </form>
        <p className={styles.linkText}>
          Вже є акаунт? <Link to="/login">Увійти</Link>
        </p>
      </div>
    </div>
  );
}
