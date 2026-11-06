import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { paymentService } from "../services/paymentService";
import { AxiosError } from "axios";
import styles from "../styles/formPage.module.css";

const PREMIUM_PRICE = 9.99;

const PREMIUM_FEATURES = [
  "AI-підказки для прогнозів (5 на день замість 2)",
  "Розширена аналітика подій",
  "Без комісії за виведення коштів",
  "Пріоритетна підтримка",
  "Ексклюзивні преміум-події",
  "Ранній доступ до нових функцій",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PremiumPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) return null;
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
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
            <div style={{
              padding: "var(--space-lg)",
              background: "rgba(168, 85, 247, 0.1)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
              borderRadius: "var(--radius-md)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "var(--font-size-lg)", fontWeight: "bold", color: "#c084fc", marginBottom: "var(--space-xs)" }}>
                ✦ Преміум активний
              </div>
              {user.premium_end_date && (
                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>
                  Діє до {formatDate(user.premium_end_date)}
                </div>
              )}
            </div>

            <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>Ваші переваги:</strong>
              {PREMIUM_FEATURES.map((f) => (
                <div key={f} style={{ display: "flex", gap: "var(--space-sm)", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "#c084fc" }}>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
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
              30 днів · Щомісячна оплата через PayPal
            </p>

            {error && <p className={styles.error}>{error}</p>}

            <button
              className={styles.btn}
              style={{ background: "linear-gradient(135deg, var(--accent) 0%, #a855f7 100%)" }}
              disabled={loading}
              onClick={handlePurchase}
            >
              {loading ? "Перенаправлення на PayPal..." : "Підписатися за $9.99"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
