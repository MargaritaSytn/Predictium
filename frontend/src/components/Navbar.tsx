import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Bell, Coins, Download, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { notificationService } from "../services/notificationService";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`;

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>P</span>
          <span className={`${styles.logoText} gradient-text`}>Predictium</span>
        </Link>

        <div
          className={`${styles.navLinks} ${menuOpen ? styles.navLinksOpen : ""}`}
          onClick={() => setMenuOpen(false)}
        >
          <NavLink to="/" end className={navLinkClass}>
            Головна
          </NavLink>
          {user && (
            <>
              <NavLink to="/profile" className={navLinkClass}>
                Профіль
              </NavLink>
              <NavLink to="/finance" className={navLinkClass}>
                Фінанси
              </NavLink>
              {user.is_staff && (
                <NavLink to="/admin" className={navLinkClass}>
                  Адмін
                </NavLink>
              )}
            </>
          )}
        </div>

        <div className={styles.rightSection}>
          {user ? (
            <>
              <a
                href="/Predictium.apk"
                download="Predictium.apk"
                className={styles.notifBell}
                aria-label="Завантажити Android APK"
                title="Завантажити Android APK"
              >
                <Download size={18} strokeWidth={1.75} />
              </a>
              <NavLink to="/notifications" className={styles.notifBell} aria-label="Сповіщення">
                <Bell size={18} strokeWidth={1.75} />
                {unreadCount > 0 && (
                  <span className={styles.unreadBadge}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </NavLink>
              <Link to="/finance" className={styles.balanceBadge}>
                <span className={styles.balanceIcon}>
                  <Coins size={16} strokeWidth={2} />
                </span>
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
          <button
            type="button"
            className={styles.menuToggle}
            aria-label="Меню"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
