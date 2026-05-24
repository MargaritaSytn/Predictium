import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const { user } = useAuth();

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
          </>
        )}
      </div>

      <div className={styles.rightSection}>
        {user ? (
          <Link to="/finance" className={styles.balanceBadge}>
            <span className={styles.balanceIcon}>🪙</span>
            <div className={styles.balanceInfo}>
              <span className={styles.balanceLabel}>Баланс</span>
              <span className={styles.balanceAmount}>
                {user.wallet_balance.toLocaleString()} токенів
              </span>
            </div>
          </Link>
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
