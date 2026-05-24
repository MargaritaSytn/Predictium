import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { paymentService } from "../services/paymentService";
import { AxiosError } from "axios";
import styles from "../styles/formPage.module.css";

const PREMIUM_PRICE = 9.99;

const PREMIUM_FEATURES = [
  "AI-підказки для прогнозів (5 на день)",
  "Розширена аналітика",
  "Пріоритетна підтримка",
  "Ексклюзивні преміум-події",
  "Без комісії за виведення",
  "Ранній доступ до нових функцій",
];

export default function PremiumPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) return <Navigate to="/login" replace />;

  const handlePurchase = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await paymentService.purchasePremium();
      window.location.href = res.data.approval_url;
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setError(axiosErr.response?.data?.detail || "Помилка покупки");
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link to="/finance" className={styles.backLink}>← Назад до фінансів</Link>
      <div className={styles.card}>
        <h1 className={styles.h1}>Преміум підписка</h1>
        <p className={styles.subtitle}>Розблокуйте повний досвід Predictium</p>

        {user.premium_status ? (
          <div className={styles.success} style={{ padding: "1rem", background: "var(--success-light)", borderRadius: "var(--radius-md)" }}>
            У вас активна Преміум підписка!
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "var(--space-xl)" }}>
              {PREMIUM_FEATURES.map((feature) => (
                <div key={feature} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-md)",
                  padding: "var(--space-md) 0",
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  fontSize: "var(--font-size-sm)",
                }}>
                  <span style={{ color: "var(--success)", fontWeight: "bold" }}>✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div style={{
              textAlign: "center",
              fontSize: "var(--font-size-2xl)",
              fontWeight: "bold",
              color: "var(--warning)",
              marginBottom: "var(--space-xs)",
            }}>
              ${PREMIUM_PRICE}/міс
            </div>
            <p style={{
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "var(--font-size-sm)",
              marginBottom: "var(--space-xl)",
            }}>
              Щомісячна оплата через PayPal
            </p>

            {error && <p className={styles.error}>{error}</p>}

            <button
              className={styles.btn}
              style={{ background: "linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)" }}
              disabled={loading}
              onClick={handlePurchase}
            >
              {loading ? "Перенаправлення на PayPal..." : "Підписатися"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
