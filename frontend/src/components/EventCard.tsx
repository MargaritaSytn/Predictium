import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import { Event } from "../types";
import { categoryColors, categoryLabel } from "../constants/categories";
import styles from "./EventCard.module.css";

export default function EventCard({ event }: { event: Event }) {
  const outcomes = event.outcomes || [];
  const totalWagered = outcomes.reduce((sum, o) => sum + o.total_tokens_wagered, 0);

  let yesPercent = 50;
  let noPercent = 50;
  if (totalWagered > 0 && outcomes.length >= 2) {
    yesPercent = Math.round((outcomes[0].total_tokens_wagered / totalWagered) * 100);
    noPercent = 100 - yesPercent;
  }

  const catColors = categoryColors(event.category.toLowerCase());
  const isTrending = (event.prediction_count || 0) >= 10;

  return (
    <Link to={`/events/${event.id}`} className={styles.card}>
      <div className={styles.imageWrap}>
        <div className={styles.imageOverlay} />
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}
        <span
          className={styles.categoryBadge}
          style={{
            color: catColors.fg,
            background: catColors.bg,
            borderColor: catColors.border,
          }}
        >
          {categoryLabel(event.category)}
        </span>
        {isTrending && (
          <span className={styles.trendingBadge}>
            <Flame size={14} strokeWidth={2.2} />
            Трендова
          </span>
        )}
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>{event.title}</h3>

        {outcomes.length >= 2 && (
          <div className={styles.oddsBlock}>
            <div className={styles.oddsRow}>
              <span className={styles.oddsYes}>ТАК {yesPercent}%</span>
              <span className={styles.oddsNo}>НІ {noPercent}%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressYes} style={{ width: `${yesPercent}%` }} />
            </div>
          </div>
        )}

        <span className={styles.participants}>
          {(event.prediction_count || 0).toLocaleString()} учасників
        </span>
      </div>
    </Link>
  );
}
