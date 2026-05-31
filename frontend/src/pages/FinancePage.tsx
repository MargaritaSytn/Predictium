import { useState, useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  Target,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Star,
  Coins,
  CreditCard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { paymentService } from "../services/paymentService";
import { Transaction } from "../types";
import Skeleton from "../components/Skeleton";
import SuccessModal from "../components/SuccessModal";
import styles from "./FinancePage.module.css";

const TYPE_LABELS: Record<string, string> = {
  wager: "Ставка",
  winning: "Виграш",
  bonus: "Бонус",
  purchase: "Поповнення",
  withdrawal: "Вивід",
  premium: "Преміум",
};

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Завершено",
  pending: "В обробці",
  rejected: "Відхилено",
  cancelled: "Скасовано",
};

function TypeIcon({ type }: { type: string }) {
  const props = { size: 14, strokeWidth: 2 };
  switch (type) {
    case "wager": return <TrendingUp {...props} />;
    case "winning": return <ArrowUpRight {...props} />;
    case "bonus": return <Gift {...props} />;
    case "purchase": return <Wallet {...props} />;
    case "withdrawal": return <ArrowDownLeft {...props} />;
    case "premium": return <Star {...props} />;
    default: return <Coins {...props} />;
  }
}

export default function FinancePage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const paidParam = params.get("paid");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successPayload, setSuccessPayload] = useState<{ title: string; description: React.ReactNode } | null>(null);

  useEffect(() => {
    if (user) {
      paymentService.getTransactions()
        .then((res) => setTransactions(res.data.results))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    if (!paidParam) return;
    if (paidParam === "premium") {
      setSuccessPayload({
        title: "Преміум активовано!",
        description: "Преміум-підписку увімкнено на 30 днів.",
      });
    } else if (paidParam === "withdraw") {
      const wd = params.get("amount") || "";
      setSuccessPayload({
        title: "Заявку прийнято!",
        description: <>Виведення <strong>{wd} токенів</strong> знаходиться в обробці.</>,
      });
    } else {
      const tokensAdded = Number(paidParam) || 0;
      setSuccessPayload({
        title: "Оплату підтверджено!",
        description: <><strong>{tokensAdded.toLocaleString()} токенів</strong> успішно додано до вашого балансу.</>,
      });
    }
    setSuccessOpen(true);
  }, [paidParam, params]);

  const handleCloseSuccess = () => {
    setSuccessOpen(false);
    const next = new URLSearchParams(params);
    next.delete("paid");
    next.delete("amount");
    setParams(next, { replace: true });
  };

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
    ? Math.round(user.success_rate)
    : 0;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "wager": return "var(--warning)";
      case "winning": return "var(--success)";
      case "bonus": return "#c084fc";
      case "purchase": return "var(--info)";
      case "withdrawal": return "var(--danger)";
      case "premium": return "var(--warning)";
      default: return "var(--text-secondary)";
    }
  };

  return (
    <div className={styles.page}>
      {successPayload && (
        <SuccessModal
          open={successOpen}
          title={successPayload.title}
          description={successPayload.description}
          subtext={paidParam === "withdraw" ? "Зазвичай займає 1–3 робочих дні." : undefined}
          buttonLabel={paidParam === "withdraw" ? "Закрити" : "Чудово!"}
          onClose={handleCloseSuccess}
        />
      )}
      <header className={styles.headerBlock}>
        <h1 className={styles.heading}>Фінанси та токени</h1>
        <p className={styles.subtitle}>Керуйте своїм балансом та переглядайте історію</p>
      </header>

      <div className={styles.balanceSection}>
        <div className={styles.balanceCard}>
          <div className={styles.balanceTop}>
            <div className={styles.balanceIcon}>
              <Wallet size={24} strokeWidth={1.75} />
            </div>
            <div className={styles.balanceCaption}>
              <div className={styles.balanceLabel}>Загальний баланс</div>
              <div className={styles.balanceValue}>
                {balance.toLocaleString()}
                <span className={styles.balanceValueUnit}> токенів</span>
              </div>
              <div className={styles.balanceUsd}>≈ ${usdValue} USD</div>
            </div>
          </div>
          <div className={styles.balanceActions}>
            <Link to="/buy-tokens" className={styles.btnBuy}>
              <CreditCard size={16} /> Купити токени
            </Link>
            <Link to="/withdraw" className={styles.btnWithdraw}>
              <ArrowDownLeft size={16} /> Вивести кошти
            </Link>
          </div>
        </div>

        <div className={styles.sideStats}>
          <div className={styles.sideStatCard}>
            <div className={styles.sideStatHeader}>
              <span className={styles.sideStatIcon} style={{ color: "var(--success)" }}>
                <TrendingUp size={16} />
              </span>
              <span className={styles.sideStatLabel}>Прибуток місяця</span>
            </div>
            <div
              className={styles.sideStatValue}
              style={{ color: monthlyProfit >= 0 ? "var(--success)" : "var(--danger)" }}
            >
              {monthlyProfit >= 0 ? "+" : ""}{Math.round(monthlyProfit).toLocaleString()}
              <span className={styles.sideStatUnit}> токенів</span>
            </div>
          </div>
          <div className={styles.sideStatCard}>
            <div className={styles.sideStatHeader}>
              <span className={styles.sideStatIcon}>
                <Coins size={16} />
              </span>
              <span className={styles.sideStatLabel}>Всього ставок</span>
            </div>
            <div className={styles.sideStatValue}>
              {totalBets}
              <span className={styles.sideStatUnit}> за весь час</span>
            </div>
          </div>
          <div className={styles.sideStatCard}>
            <div className={styles.sideStatHeader}>
              <span className={styles.sideStatIcon} style={{ color: "var(--accent)" }}>
                <Target size={16} />
              </span>
              <span className={styles.sideStatLabel}>Успішність</span>
            </div>
            <div className={styles.sideStatValue}>
              {successRate}%
              <span className={styles.sideStatUnit}> виграшних прогнозів</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.infoBanner}>
        <span className={styles.infoBannerIcon}>
          <AlertTriangle size={18} />
        </span>
        <div>
          <div className={styles.infoBannerTitle}>Важлива інформація</div>
          <div className={styles.infoBannerText}>
            При виведенні коштів стягується сервісна комісія 3%. Мінімальна сума для виведення — 1000 токенів.
          </div>
        </div>
      </div>

      <div className={styles.historyCard}>
        <h2 className={styles.historyTitle}>Історія транзакцій</h2>
        {loading ? (
          <div className={styles.skeletonRows}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={56} radius="var(--radius-md)" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className={styles.emptyState}>Транзакцій ще немає</p>
        ) : (
          <div className={styles.tableWrap}>
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
                  const color = getTypeColor(tx.type);
                  return (
                    <tr key={tx.id}>
                      <td>{new Date(tx.created_at).toLocaleDateString("uk-UA")}</td>
                      <td>
                        <span
                          className={styles.typeBadge}
                          style={{
                            color,
                            background: `${color}1f`,
                            borderColor: `${color}55`,
                          }}
                        >
                          <TypeIcon type={tx.type} />
                          {TYPE_LABELS[tx.type] || tx.type}
                        </span>
                      </td>
                      <td className={styles.descCell}>
                        {tx.description || TYPE_LABELS[tx.type] || tx.type}
                      </td>
                      <td className={isPositive ? styles.amountPositive : styles.amountNegative}>
                        {isPositive ? "+" : ""}{Math.round(tx.amount).toLocaleString()}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[`status_${tx.status}`] || ""}`}>
                          {STATUS_LABELS[tx.status] || tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
