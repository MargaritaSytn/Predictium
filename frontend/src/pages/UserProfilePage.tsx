import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { socialService } from "../services/socialService";
import { useAuth } from "../context/AuthContext";
import { PublicUser } from "../types";
import { AxiosError } from "axios";
import styles from "./UserProfilePage.module.css";

const REPORT_REASONS = [
  { value: "spam", label: "Спам" },
  { value: "offensive", label: "Образливий контент" },
  { value: "misinformation", label: "Дезінформація" },
  { value: "harassment", label: "Переслідування" },
  { value: "other", label: "Інше" },
];

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDesc, setReportDesc] = useState("");
  const [reportMsg, setReportMsg] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    socialService.getPublicProfile(id)
      .then((res) => setProfile(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      if (profile.is_following) {
        await socialService.unfollowUser(profile.id);
        setProfile({ ...profile, is_following: false, followers_count: profile.followers_count - 1 });
      } else {
        await socialService.followUser(profile.id);
        setProfile({ ...profile, is_following: true, followers_count: profile.followers_count + 1 });
      }
    } catch {
      // silently fail
    } finally {
      setFollowLoading(false);
    }
  };

  const handleReport = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!profile) return;
    setReportSubmitting(true);
    setReportMsg("");
    try {
      await socialService.createReport({
        reported_user: profile.id,
        reason: reportReason,
        description: reportDesc,
      });
      setReportMsg("Скаргу надіслано. Дякуємо!");
      setReportDesc("");
      setShowReport(false);
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setReportMsg(axiosErr.response?.data?.detail || "Помилка надсилання скарги");
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) return <p className={styles.loading}>Завантаження...</p>;
  if (!profile) return <p className={styles.loading}>Користувача не знайдено.</p>;

  const isOwnProfile = currentUser && currentUser.id === profile.id;

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
            <span className={styles.socialStatValue}>{profile.followers_count}</span>
            <span className={styles.socialStatLabel}>підписників</span>
          </div>
          <div className={styles.socialStat}>
            <span className={styles.socialStatValue}>{profile.following_count}</span>
            <span className={styles.socialStatLabel}>підписок</span>
          </div>
        </div>

        {currentUser && !isOwnProfile && (
          <div className={styles.actions}>
            <button
              className={`${styles.followBtn} ${profile.is_following ? styles.followBtnActive : ""}`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {profile.is_following ? "Відписатися" : "Підписатися"}
            </button>
            <button
              className={styles.reportBtn}
              onClick={() => setShowReport(!showReport)}
            >
              Поскаржитися
            </button>
          </div>
        )}

        {reportMsg && <p className={styles.reportMsg}>{reportMsg}</p>}

        {showReport && (
          <form className={styles.reportForm} onSubmit={handleReport}>
            <select
              className={styles.select}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <textarea
              className={styles.textarea}
              placeholder="Опишіть причину скарги..."
              value={reportDesc}
              onChange={(e) => setReportDesc(e.target.value)}
              rows={3}
            />
            <button type="submit" className={styles.submitBtn} disabled={reportSubmitting}>
              {reportSubmitting ? "Надсилання..." : "Надіслати скаргу"}
            </button>
          </form>
        )}
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
