import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { paymentService } from "../services/paymentService";
import { Transaction } from "../types";
import styles from "./FinancePage.module.css";

const TYPE_LABELS: Record<string, string> = {
  wager: "Ставка",
  winning: "Виграш",
  bonus: "Бонус",
  purchase: "Поповнення",
  withdrawal: "Вивід",
  premium: "Преміум",
};

const TYPE_STYLES: Record<string, string> = {
  wager: styles.typeWager,
  winning: styles.typeWinning,
  bonus: styles.typeBonus,
  purchase: styles.typePurchase,
  withdrawal: styles.typeWithdrawal,
  premium: styles.typePremium,
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Завершено",
  pending: "В обробці",
  rejected: "Відхилено",
  cancelled: "Скасовано",
};

const STATUS_STYLES: Record<string, string> = {
  confirmed: styles.statusConfirmed,
  pending: styles.statusPending,
  rejected: styles.statusRejected,
  cancelled: styles.statusRejected,
};

export default function FinancePage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      paymentService.getTransactions()
        .then((res) => setTransactions(res.data.results))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!user) return <Navigate to="/login" replace />;

  const balance = user.wallet_balance;
  const usdValue = (balance * 0.1).toFixed(2);

  const totalBets = transactions.filter((t) => t.type === "wager").length;
  const monthlyProfit = transactions
    .filter((t) => {
      const d = new Date(t.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        && (t.type === "winning" || t.type === "wager");
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const successRate = user.total_predictions > 0
    ? Math.round(user.success_rate * 100)
    : 0;

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Фінанси та токени</h1>
      <p className={styles.subtitle}>Керуйте своїм балансом та переглядайте історію</p>

      {/* Balance + side stats */}
      <div className={styles.balanceSection}>
        <div className={styles.balanceCard}>
          <span className={styles.balanceIcon}>💳</span>
          <div className={styles.balanceLabel}>Загальний баланс</div>
          <div className={styles.balanceValue}>
            {balance.toLocaleString()}
            <span className={styles.balanceValueUnit}> токенів</span>
          </div>
          <div className={styles.balanceUsd}>≈ ${usdValue} USD</div>
          <div className={styles.balanceActions}>
            <Link to="/buy-tokens" className={styles.btnBuy}>
              🅿 Купити токени
            </Link>
            <Link to="/withdraw" className={styles.btnWithdraw}>
              ↙ Вивести кошти
            </Link>
          </div>
        </div>

        <div className={styles.sideStats}>
          <div className={styles.sideStatCard}>
            <span className={styles.sideStatIcon}>📈</span>
            <div className={styles.sideStatLabel}>Прибуток місяця</div>
            <div className={styles.sideStatValue}>
              {monthlyProfit >= 0 ? "+" : ""}{Math.round(monthlyProfit).toLocaleString()}
              <span className={styles.sideStatUnit}> токенів</span>
            </div>
          </div>
          <div className={styles.sideStatCard}>
            <span className={styles.sideStatIcon}>💰</span>
            <div className={styles.sideStatLabel}>Всього ставок</div>
            <div className={styles.sideStatValue} style={{ color: "var(--text-primary)" }}>
              {totalBets}
              <span className={styles.sideStatUnit}> за весь час</span>
            </div>
          </div>
          <div className={styles.sideStatCard}>
            <span className={styles.sideStatIcon}>🎯</span>
            <div className={styles.sideStatLabel}>Успішність</div>
            <div className={styles.sideStatValue} style={{ color: "var(--text-primary)" }}>
              {successRate}%
              <span className={styles.sideStatUnit}> виграшних прогнозів</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className={styles.infoBanner}>
        <span className={styles.infoBannerIcon}>⚠️</span>
        <div>
          <div className={styles.infoBannerTitle}>Важлива інформація</div>
          <div className={styles.infoBannerText}>
            При виведенні коштів стягується сервісна комісія 3%. Мінімальна сума для виведення — 1000 токенів.
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className={styles.historyCard}>
        <h2 className={styles.historyTitle}>Історія транзакцій</h2>
        {loading ? (
          <p className={styles.loading}>Завантаження...</p>
        ) : transactions.length === 0 ? (
          <p className={styles.emptyState}>Транзакцій ще немає</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Тип</th>
                <th>Опис</th>
                <th>Сума</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isPositive = ["winning", "bonus", "purchase"].includes(tx.type);
                return (
                  <tr key={tx.id}>
                    <td>{new Date(tx.created_at).toLocaleDateString("uk-UA")}</td>
                    <td>
                      <span className={`${styles.typeBadge} ${TYPE_STYLES[tx.type] || ""}`}>
                        {TYPE_LABELS[tx.type] || tx.type}
                      </span>
                    </td>
                    <td>{tx.description || TYPE_LABELS[tx.type] || tx.type}</td>
                    <td className={isPositive ? styles.amountPositive : styles.amountNegative}>
                      {isPositive ? "+" : ""}{Math.round(tx.amount).toLocaleString()}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${STATUS_STYLES[tx.status] || ""}`}>
                        {STATUS_LABELS[tx.status] || tx.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
