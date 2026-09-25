import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificationService } from "../services/notificationService";
import { Notification } from "../types";
import styles from "./NotificationsPage.module.css";

const TYPE_LABELS: Record<string, string> = {
  deadline_reminder: "Нагадування",
  new_event: "Нова подія",
  voting_closed: "Голосування закрито",
  result_announced: "Результат",
  system: "Система",
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(() => {
    notificationService.getNotifications()
      .then((res) => setNotifications(res.data.results))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const handleMarkRead = (id: number) => {
    notificationService.markRead(id).then(() => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    });
  };

  const handleMarkAll = () => {
    setMarkingAll(true);
    notificationService.markAllRead()
      .then(() => setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true }))))
      .finally(() => setMarkingAll(false));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>Сповіщення</h1>
          <p className={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} непрочитаних` : "Всі прочитані"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            className={styles.markAllBtn}
            onClick={handleMarkAll}
            disabled={markingAll}
          >
            Відмітити всі як прочитані
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Завантаження…</div>
      ) : notifications.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🔔</span>
          <p>У вас поки немає сповіщень.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`${styles.item} ${n.is_read ? styles.itemRead : styles.itemUnread}`}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
            >
              <div className={styles.itemTop}>
                <span className={styles.typeBadge}>{TYPE_LABELS[n.type] ?? n.type}</span>
                <span className={styles.time}>
                  {new Date(n.send_time).toLocaleString("uk-UA")}
                </span>
              </div>
              <p className={styles.title}>{n.title}</p>
              <p className={styles.message}>{n.message}</p>
              {!n.is_read && <span className={styles.unreadDot} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
