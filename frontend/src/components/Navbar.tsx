import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notificationService } from "../services/notificationService";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const fetchCount = () => {
      notificationService.getUnreadCount()
        .then((res) => setUnreadCount(res.data.unread_count))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <nav className={styles.navbar}>
      <Link to="/" className={styles.logo}>
        <span className={styles.logoIcon}>P</span>
        Predictium
      </Link>

      <div className={styles.navLinks}>
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
          }
        >
          Головна
        </NavLink>
        {user && (
          <>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
              }
            >
              Профіль
            </NavLink>
            <NavLink
              to="/finance"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
              }
            >
              Фінанси
            </NavLink>
            {user.is_staff && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
                }
              >
                Адмін
              </NavLink>
            )}
          </>
        )}
      </div>

      <div className={styles.rightSection}>
        {user ? (
          <>
            <NavLink to="/notifications" className={styles.notifBell}>
              <span>🔔</span>
              {unreadCount > 0 && (
                <span className={styles.unreadBadge}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </NavLink>
            <Link to="/finance" className={styles.balanceBadge}>
              <span className={styles.balanceIcon}>🪙</span>
              <div className={styles.balanceInfo}>
                <span className={styles.balanceLabel}>Баланс</span>
                <span className={styles.balanceAmount}>
                  {user.wallet_balance.toLocaleString()} токенів
                </span>
              </div>
            </Link>
          </>
        ) : (
          <div className={styles.authLinks}>
            <Link to="/login" className={styles.loginLink}>
              Увійти
            </Link>
            <Link to="/register" className={styles.registerBtn}>
              Реєстрація
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
