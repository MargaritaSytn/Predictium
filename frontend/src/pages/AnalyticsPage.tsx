import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../services/adminService";
import { PlatformStats, AdminUser, PaginatedResponse } from "../types";
import styles from "./AnalyticsPage.module.css";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersMeta, setUsersMeta] = useState<{ count: number; page: number }>({ count: 0, page: 1 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, []);

  const loadUsers = (page: number) => {
    setUsersLoading(true);
    adminService.getUsers(page)
      .then((res: { data: PaginatedResponse<AdminUser> }) => {
        setUsers(res.data.results);
        setUsersMeta({ count: res.data.count, page });
      })
      .catch(console.error)
      .finally(() => setUsersLoading(false));
  };

  useEffect(() => { loadUsers(1); }, []);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_staff) return <Navigate to="/" replace />;

  const totalUserPages = Math.ceil(usersMeta.count / 10);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>Аналітика платформи</h1>
          <p className={styles.subtitle}>Огляд ключових метрик</p>
        </div>
        <Link to="/admin" className={styles.backLink}>← Управління подіями</Link>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <p className={styles.loading}>Завантаження статистики...</p>
      ) : stats ? (
        <>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Всього користувачів</p>
              <p className={styles.statValue}>{stats.users.total}</p>
              <p className={styles.statSub}>Premium: {stats.users.premium}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Відкритих подій</p>
              <p className={styles.statValue}>{stats.events.open}</p>
              <p className={styles.statSub}>Всього: {stats.events.total} · Завершено: {stats.events.completed}</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Прогнозів</p>
              <p className={styles.statValue}>{stats.predictions.total.toLocaleString()}</p>
              <p className={styles.statSub}>{stats.predictions.total_tokens_wagered.toLocaleString()} токенів у ставках</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Виручка (USD)</p>
              <p className={`${styles.statValue} ${styles.statValueGreen}`}>${stats.revenue.total_purchases_usd.toFixed(2)}</p>
              <p className={styles.statSub}>
                Виведено: ${stats.revenue.total_withdrawals_usd.toFixed(2)} ·{" "}
                <span className={stats.revenue.net_usd >= 0 ? styles.positive : styles.negative}>
                  Нетто: ${stats.revenue.net_usd.toFixed(2)}
                </span>
              </p>
            </div>
          </div>

          {/* Premium bar */}
          <div className={styles.barCard}>
            <p className={styles.barLabel}>Premium-користувачі</p>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: stats.users.total > 0 ? `${(stats.users.premium / stats.users.total) * 100}%` : "0%" }}
              />
            </div>
            <p className={styles.barText}>
              {stats.users.premium} з {stats.users.total} ({stats.users.total > 0 ? ((stats.users.premium / stats.users.total) * 100).toFixed(1) : 0}%)
            </p>
          </div>
        </>
      ) : null}

      {/* User table */}
      <div className={styles.usersSection}>
        <h2 className={styles.sectionTitle}>Користувачі ({usersMeta.count})</h2>
        {usersLoading ? (
          <p className={styles.loading}>Завантаження...</p>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Ім'я</th>
                    <th>Email</th>
                    <th>Premium</th>
                    <th>Баланс</th>
                    <th>Прогнози</th>
                    <th>Успіх %</th>
                    <th>Стрік</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <span className={u.is_staff ? styles.adminBadge : ""}>{u.username}</span>
                      </td>
                      <td className={styles.emailCell}>{u.email}</td>
                      <td>{u.premium_status ? <span className={styles.premiumTag}>✓</span> : "—"}</td>
                      <td>{u.wallet_balance.toLocaleString()} T</td>
                      <td>{u.total_predictions}</td>
                      <td>{u.success_rate > 0 ? `${(u.success_rate * 100).toFixed(0)}%` : "—"}</td>
                      <td>{u.consecutive_login_days > 0 ? `🔥 ${u.consecutive_login_days}` : "—"}</td>
                      <td>
                        <span className={u.is_active ? styles.activeTag : styles.inactiveTag}>
                          {u.is_active ? "активний" : "заблок."}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalUserPages > 1 && (
              <div className={styles.pagination}>
                <button
                  disabled={usersMeta.page === 1}
                  onClick={() => loadUsers(usersMeta.page - 1)}
                  className={styles.pageBtn}
                >← Назад</button>
                <span className={styles.pageInfo}>{usersMeta.page} / {totalUserPages}</span>
                <button
                  disabled={usersMeta.page === totalUserPages}
                  onClick={() => loadUsers(usersMeta.page + 1)}
                  className={styles.pageBtn}
                >Вперед →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
