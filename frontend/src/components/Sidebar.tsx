import { useEffect, useState } from "react";
import { TrendingUp, Trophy } from "lucide-react";
import { authService } from "../services/authService";
import { CATEGORIES } from "../constants/categories";
import { TopPredictor } from "../types";
import styles from "./Sidebar.module.css";

const SIDEBAR_CATEGORIES = [{ value: "", label: "Всі" }, ...CATEGORIES];

interface SidebarProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function Sidebar({ activeCategory, onCategoryChange }: SidebarProps) {
  const [topPredictors, setTopPredictors] = useState<TopPredictor[]>([]);

  useEffect(() => {
    authService.getTopPredictors()
      .then((res) => setTopPredictors(res.data))
      .catch(() => {});
  }, []);

  const getRankClass = (index: number) => {
    if (index === 0) return styles.rank1;
    if (index === 1) return styles.rank2;
    if (index === 2) return styles.rank3;
    return styles.rankDefault;
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <TrendingUp size={16} strokeWidth={2} />
          Категорії
        </h3>
        <ul className={styles.categoryList}>
          {SIDEBAR_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.value;
            return (
              <li key={cat.value}>
                <button
                  className={`${styles.categoryItem} ${isActive ? styles.categoryItemActive : ""}`}
                  onClick={() => onCategoryChange(cat.value)}
                >
                  <span>{cat.label}</span>
                  {isActive && <span className={styles.activeDot} />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {topPredictors.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            <Trophy size={16} strokeWidth={2} className={styles.trophyIcon} />
            Топ Прогнозисти
          </h3>
          <div className={styles.leaderboardList}>
            {topPredictors.map((predictor, index) => (
              <div key={predictor.id} className={styles.leaderboardItem}>
                <span className={`${styles.rankCircle} ${getRankClass(index)}`}>
                  {index + 1}
                </span>
                <div className={styles.leaderboardInfo}>
                  <span className={styles.leaderboardName}>{predictor.username}</span>
                  <span className={styles.leaderboardAccuracy}>
                    {Math.round(predictor.success_rate)}% точність
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
