import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { paymentService } from "../services/paymentService";
import { AxiosError } from "axios";
import styles from "../styles/formPage.module.css";

const WITHDRAWAL_FEE = 0.03;
const MIN_WITHDRAWAL = 100;
const TOKEN_PRICE_USD = 0.10;

export default function WithdrawPage() {
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!user) return <Navigate to="/login" replace />;

  const tokenAmount = parseInt(amount) || 0;
  const fee = Math.ceil(tokenAmount * WITHDRAWAL_FEE);
  const netTokens = tokenAmount - fee;
  const netUSD = (netTokens * TOKEN_PRICE_USD).toFixed(2);

  const handleWithdraw = async () => {
    if (tokenAmount < MIN_WITHDRAWAL) {
      setError(`Мінімальна сума виведення — ${MIN_WITHDRAWAL} токенів.`);
      return;
    }
    if (tokenAmount > user.wallet_balance) {
      setError("Недостатньо коштів на балансі.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await paymentService.withdraw(tokenAmount);
      setSuccess(`Виведення ініційовано! ${res.data.tokens_withdrawn} токенів виведено, ви отримаєте $${res.data.net_usd.toFixed(2)}.`);
      setAmount("");
      await refreshUser();
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setError(axiosErr.response?.data?.detail || "Помилка виведення");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <Link to="/finance" className={styles.backLink}>← Назад до фінансів</Link>
      <div className={styles.card}>
        <h1 className={styles.h1}>Вивести кошти</h1>
        <p className={styles.subtitle}>Доступний баланс: {user.wallet_balance.toLocaleString()} токенів</p>

        <div className={styles.warning}>
          Комісія {WITHDRAWAL_FEE * 100}% стягується при виведенні. Мінімальна сума: {MIN_WITHDRAWAL} токенів.
        </div>

        <input
          className={styles.input}
          type="number"
          min={MIN_WITHDRAWAL}
          max={user.wallet_balance}
          placeholder={`Кількість токенів (мін. ${MIN_WITHDRAWAL})`}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {tokenAmount >= MIN_WITHDRAWAL && (
          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span>Виведення:</span>
              <span className={styles.summaryValue}>{tokenAmount.toLocaleString()} токенів</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Комісія ({WITHDRAWAL_FEE * 100}%):</span>
              <span className={styles.summaryValueRed}>-{fee} токенів</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Ви отримаєте:</span>
              <span className={styles.summaryValueGreen}>${netUSD}</span>
            </div>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}

        <button
          className={styles.btn}
          disabled={loading || tokenAmount < MIN_WITHDRAWAL}
          onClick={handleWithdraw}
        >
          {loading ? "Обробка..." : "Вивести на PayPal"}
        </button>
      </div>
    </div>
  );
}
