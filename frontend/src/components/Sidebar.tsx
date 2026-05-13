import { useEffect, useState } from "react";
import { authService } from "../services/authService";
import { TopPredictor } from "../types";
import styles from "./Sidebar.module.css";

const CATEGORIES = [
  { value: "", label: "Всі" },
  { value: "sports", label: "Спорт" },
  { value: "politics", label: "Політика" },
  { value: "technology", label: "Технології" },
  { value: "crypto", label: "Криптовалюта" },
  { value: "space", label: "Космос" },
];

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
        <h3 className={styles.sectionTitle}>📊 Категорії</h3>
        <ul className={styles.categoryList}>
          {CATEGORIES.map((cat) => (
            <li key={cat.value}>
              <button
                className={`${styles.categoryItem} ${activeCategory === cat.value ? styles.categoryItemActive : ""}`}
                onClick={() => onCategoryChange(cat.value)}
              >
                {cat.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {topPredictors.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>🏆 Топ Прогнозисти</h3>
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
