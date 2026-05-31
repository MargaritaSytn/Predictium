import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import {
  Award,
  Gift,
  Flame,
  TrendingUp,
  Target,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  Sparkles,
} from "lucide-react";
import { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { predictionService } from "../services/predictionService";
import { paymentService } from "../services/paymentService";
import { Link } from "react-router-dom";
import { Prediction, FeedPrediction, Transaction, User } from "../types";
import DonutChart from "../components/DonutChart";
import Skeleton from "../components/Skeleton";
import styles from "./ProfilePage.module.css";

const DAILY_BONUS_AMOUNT = 10;

function statusIcon(status: string) {
  const props = { size: 16, strokeWidth: 2 };
  if (status === "won") return <CheckCircle2 {...props} className={styles.statusIconWon} />;
  if (status === "lost") return <XCircle {...props} className={styles.statusIconLost} />;
  return <Clock {...props} className={styles.statusIconPending} />;
}

function statusLabel(status: string) {
  if (status === "won") return "Виграш";
  if (status === "lost") return "Програш";
  if (status === "refunded") return "Повернено";
  return "В очікуванні";
}

export default function ProfilePage() {
  const { user: authUser, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<FeedPrediction[]>([]);
  const [activeTab, setActiveTab] = useState<"my" | "feed">("my");
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser) return;
    setLoading(true);
    Promise.all([
      authService.getProfile().then((r) => setProfile(r.data)),
      predictionService.getMyPredictions().then((r) => setPredictions(r.data.results)).catch(() => {}),
      paymentService.getTransactions().then((r) => setTransactions(r.data.results)).catch(() => {}),
      predictionService.getFriendsFeed().then((r) => setFeed(r.data)).catch(() => {}),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authUser]);

  if (!authUser) return <Navigate to="/login" replace />;
  if (loading || !profile) {
    return (
      <div className={styles.page}>
        <Skeleton height={180} radius="var(--radius-lg)" />
        <div className={styles.statsGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={160} radius="var(--radius-lg)" />
          ))}
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const bonusClaimed = profile.last_login_date === today;
  const streak = profile.consecutive_login_days || 0;
  const isActiveUser = streak >= 5;

  const totalProfit = transactions.reduce((sum, tx) => {
    if (tx.type === "winning") return sum + tx.amount;
    if (tx.type === "wager") return sum - Math.abs(tx.amount);
    return sum;
  }, 0);

  const activePredictions = predictions.filter((p) => p.prediction_status === "pending").length;
  const successPercent = profile.success_rate;
  const lostPredictions = predictions.filter((p) => p.prediction_status === "lost").length;

  const handleClaimBonus = async () => {
    setClaimingBonus(true);
    setClaimError(null);
    try {
      const res = await authService.claimDailyBonus();
      setProfile(res.data.user);
      await refreshUser();
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setClaimError(axiosErr.response?.data?.detail || "Не вдалося отримати бонус");
    } finally {
      setClaimingBonus(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.identityRow}>
        <div className={styles.identityCard}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatar}>
              {profile.username.charAt(0).toUpperCase()}
            </div>
            {isActiveUser && (
              <span className={styles.avatarBadge} title="Активний користувач">
                <Award size={14} strokeWidth={2} />
              </span>
            )}
          </div>
          <div className={styles.identityInfo}>
            <div className={styles.identityHeader}>
              <h1 className={styles.username}>{profile.username}</h1>
              {profile.premium_status && (
                <span className={styles.premiumBadge}>
                  <Sparkles size={12} /> Premium
                </span>
              )}
            </div>
            <p className={styles.joinDate}>
              Член з {new Date(profile.registration_date).toLocaleDateString("uk-UA", {
                month: "long",
                year: "numeric",
              })}
            </p>
            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
            {isActiveUser && (
              <span className={styles.activeBadge}>
                <Zap size={12} strokeWidth={2.4} /> Активний користувач тижня
              </span>
            )}
          </div>
          <button className={styles.logoutBtn} onClick={logout} title="Вийти">
            <LogOut size={16} />
          </button>
        </div>

        <div className={styles.bonusCard}>
          <div className={styles.bonusHeader}>
            <span className={styles.bonusIcon}>
              <Gift size={20} strokeWidth={1.75} />
            </span>
            <span className={styles.bonusTitle}>Щоденний бонус</span>
          </div>
          <div className={styles.bonusAmount}>+{DAILY_BONUS_AMOUNT} токенів</div>
          <button
            type="button"
            className={`${styles.bonusBtn} ${bonusClaimed ? styles.bonusBtnDisabled : ""}`}
            onClick={handleClaimBonus}
            disabled={bonusClaimed || claimingBonus}
          >
            {bonusClaimed ? "Бонус забрано" : claimingBonus ? "Обробка..." : "Забрати бонус"}
          </button>
          {claimError && <p className={styles.bonusError}>{claimError}</p>}
          <div className={styles.bonusStreak}>
            <Flame size={14} strokeWidth={2.2} />
            <span>Серія: {streak} {streak === 1 ? "день" : streak >= 2 && streak <= 4 ? "дні" : "днів"} поспіль</span>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <Target size={16} className={styles.statHeaderIcon} />
            <span>Win Rate</span>
          </div>
          <div className={styles.donutWrap}>
            <DonutChart percentage={successPercent} size={120} />
          </div>
          <div className={styles.donutLegend}>
            <span><span className={`${styles.dot} ${styles.dotWon}`} /> {profile.won_predictions} виграних</span>
            <span><span className={`${styles.dot} ${styles.dotLost}`} /> {lostPredictions} програшних</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <TrendingUp size={16} className={styles.statHeaderIcon} />
            <span>Сумарний прибуток</span>
          </div>
          <div
            className={styles.statValue}
            style={{ color: totalProfit >= 0 ? "var(--success)" : "var(--danger)" }}
          >
            {totalProfit >= 0 ? "+" : ""}{Math.round(totalProfit).toLocaleString()}
          </div>
          <div className={styles.statSub}>токенів за весь час</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <Target size={16} className={styles.statHeaderIcon} />
            <span>Всього прогнозів</span>
          </div>
          <div className={styles.statValue}>{profile.total_predictions}</div>
          <div className={styles.statSub}>Активних: {activePredictions}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <Zap size={16} className={styles.statHeaderIcon} style={{ color: "var(--accent)" }} />
            <span>Серія входів</span>
          </div>
          <div className={`${styles.statValue} ${styles.statValueAccent}`}>{streak}</div>
          <div className={styles.statSub}>днів поспіль</div>
        </div>
      </div>

      <div className={styles.historyCard}>
        <div className={styles.tabRow}>
          <button
            className={`${styles.tab} ${activeTab === "my" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("my")}
          >
            Мої прогнози
          </button>
          <button
            className={`${styles.tab} ${activeTab === "feed" ? styles.tabActive : ""}`}
            onClick={() => setActiveTab("feed")}
          >
            Стрічка підписок
          </button>
        </div>

        {activeTab === "my" && (
          predictions.length === 0 ? (
            <p className={styles.emptyState}>Ви ще не зробили жодного прогнозу.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Подія</th>
                    <th>Прогноз</th>
                    <th>Ставка</th>
                    <th>Результат</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((p) => {
                    const profit = (p.payout_amount || 0) - p.amount_tokens;
                    const showProfit = p.prediction_status === "won" || p.prediction_status === "lost";
                    return (
                      <tr key={p.id}>
                        <td>{new Date(p.created_at).toLocaleDateString("uk-UA")}</td>
                        <td className={styles.eventCell}>{p.event_title}</td>
                        <td><span className={styles.predictionBadge}>{p.outcome_label}</span></td>
                        <td>{p.amount_tokens.toLocaleString()}</td>
                        <td className={profit >= 0 ? styles.amountPositive : styles.amountNegative}>
                          {showProfit ? `${profit >= 0 ? "+" : ""}${Math.round(profit).toLocaleString()}` : "—"}
                        </td>
                        <td>
                          <span className={styles.statusCell}>
                            {statusIcon(p.prediction_status)}
                            {statusLabel(p.prediction_status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === "feed" && (
          feed.length === 0 ? (
            <p className={styles.emptyState}>
              Підпишіться на користувачів, щоб бачити їхні прогнози.
            </p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Користувач</th>
                    <th>Подія</th>
                    <th>Прогноз</th>
                    <th>Ставка</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {feed.map((p) => (
                    <tr key={p.id}>
                      <td>{new Date(p.created_at).toLocaleDateString("uk-UA")}</td>
                      <td>
                        <Link to={`/users/${p.user_id}`} className={styles.feedUser}>
                          {p.username}
                        </Link>
                      </td>
                      <td className={styles.eventCell}>{p.event_title}</td>
                      <td><span className={styles.predictionBadge}>{p.outcome_label}</span></td>
                      <td>{p.amount_tokens.toLocaleString()}</td>
                      <td>
                        <span className={styles.statusCell}>
                          {statusIcon(p.prediction_status)}
                          {statusLabel(p.prediction_status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
