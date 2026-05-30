import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { User } from "../types";
import styles from "./UserProfilePage.module.css";

export default function ProfilePage() {
  const { user: authUser, logout } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getProfile()
      .then((res) => setProfile(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className={styles.loading}>Завантаження...</p>;
  if (!profile) return <p className={styles.loading}>Не вдалося завантажити профіль.</p>;

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backLink}>← Назад</Link>

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.avatar}>
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.username}>
              {profile.username}
              {profile.premium_status && <span className={styles.premiumBadge}>Premium</span>}
            </h1>
            <p className={styles.joinDate}>
              На платформі з {new Date(profile.registration_date).toLocaleDateString("uk-UA")}
            </p>
            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
          </div>
        </div>

        <div className={styles.socialStats}>
          <div className={styles.socialStat}>
            <span className={styles.socialStatValue}>{profile.wallet_balance}</span>
            <span className={styles.socialStatLabel}>токенів</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.followBtn} onClick={logout}>
            Вийти
          </button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{profile.success_rate.toFixed(1)}%</div>
          <div className={styles.statLabel}>Успішність</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{profile.total_predictions}</div>
          <div className={styles.statLabel}>Прогнозів</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{profile.won_predictions}</div>
          <div className={styles.statLabel}>Виграних</div>
        </div>
      </div>
    </div>
  );
}
