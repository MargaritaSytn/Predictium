import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { paymentService } from "../services/paymentService";
import { AxiosError } from "axios";
import styles from "../styles/formPage.module.css";

const TOKEN_PRICE_USD = 0.10;
const PRESETS = [500, 1200, 3000, 7000];

export default function BuyTokensPage() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) return <Navigate to="/login" replace />;

  const tokenAmount = selectedPreset || parseInt(amount) || 0;
  const totalUSD = (tokenAmount * TOKEN_PRICE_USD).toFixed(2);

  const handlePresetClick = (preset: number) => {
    setSelectedPreset(preset);
    setAmount("");
  };

  const handleCustomChange = (value: string) => {
    setAmount(value);
    setSelectedPreset(null);
  };

  const handlePurchase = async () => {
    if (tokenAmount < 10) {
      setError("Мінімальна покупка — 10 токенів.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await paymentService.purchaseTokens(tokenAmount);
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
        <h1 className={styles.h1}>Купити токени</h1>
        <p className={styles.subtitle}>Поточний баланс: {user.wallet_balance.toLocaleString()} токенів</p>

        <div className={styles.presetsGrid} style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`${styles.preset} ${selectedPreset === preset ? styles.presetSelected : ""}`}
              onClick={() => handlePresetClick(preset)}
            >
              <div className={styles.presetTokens}>{preset.toLocaleString()}</div>
              <div className={styles.presetPrice}>${(preset * TOKEN_PRICE_USD).toFixed(2)}</div>
            </button>
          ))}
        </div>

        <input
          className={styles.input}
          type="number"
          min="10"
          placeholder="Або введіть свою суму (мін. 10)"
          value={amount}
          onChange={(e) => handleCustomChange(e.target.value)}
        />

        {tokenAmount > 0 && (
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>Токенів:</span>
              <span className={styles.summaryValue}>{tokenAmount.toLocaleString()}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Вартість:</span>
              <span className={styles.summaryValueGold}>${totalUSD}</span>
            </div>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={`${styles.btn} ${styles.btnGreen}`}
          disabled={loading || tokenAmount < 10}
          onClick={handlePurchase}
        >
          {loading ? "Перенаправлення на PayPal..." : `Оплатити $${totalUSD} через PayPal`}
        </button>
      </div>
    </div>
  );
}
