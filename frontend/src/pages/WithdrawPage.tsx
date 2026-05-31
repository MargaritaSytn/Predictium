import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { paymentService } from "../services/paymentService";
import { AxiosError } from "axios";
import SuccessModal from "../components/SuccessModal";
import styles from "../styles/formPage.module.css";

const WITHDRAWAL_FEE = 0.03;
const MIN_WITHDRAWAL = 100;
const TOKEN_PRICE_USD = 0.10;

export default function WithdrawPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);

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
    if (!paypalEmail.includes("@")) {
      setError("Введіть валідний PayPal email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await paymentService.withdraw(tokenAmount, paypalEmail);
      setSuccessAmount(tokenAmount);
      setSuccessOpen(true);
      setAmount("");
      await refreshUser();
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setError(axiosErr.response?.data?.detail || "Помилка виведення");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setSuccessOpen(false);
    navigate(`/finance?paid=withdraw&amount=${successAmount}`, { replace: true });
  };

  return (
    <div className={styles.page}>
      <SuccessModal
        open={successOpen}
        title="Заявку прийнято!"
        description={<>Виведення <strong>{successAmount.toLocaleString()} токенів</strong> знаходиться в обробці.</>}
        subtext="Зазвичай займає 1–3 робочих дні."
        buttonLabel="Закрити"
        onClose={handleCloseSuccess}
      />
      <Link to="/finance" className={styles.backLink}><ArrowLeft size={16} /> Назад до фінансів</Link>
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

        <input
          className={styles.input}
          type="email"
          placeholder="PayPal email отримувача"
          value={paypalEmail}
          onChange={(e) => setPaypalEmail(e.target.value)}
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
