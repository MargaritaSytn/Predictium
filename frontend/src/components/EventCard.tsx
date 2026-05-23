import { Link } from "react-router-dom";
import { Event } from "../types";
import styles from "./EventCard.module.css";

const CATEGORY_COLORS: Record<string, string> = {
  sports: "#f44336",
  politics: "#9c27b0",
  technology: "#4caf50",
  crypto: "#ff9800",
  space: "#00bcd4",
  entertainment: "#e91e63",
  weather: "#2196f3",
};

export default function EventCard({ event }: { event: Event }) {
  const outcomes = event.outcomes || [];
  const totalWagered = outcomes.reduce((sum, o) => sum + o.total_tokens_wagered, 0);

  let yesPercent = 50;
  let noPercent = 50;
  if (totalWagered > 0 && outcomes.length >= 2) {
    yesPercent = Math.round((outcomes[0].total_tokens_wagered / totalWagered) * 100);
    noPercent = 100 - yesPercent;
  }

  const catColor = CATEGORY_COLORS[event.category.toLowerCase()] || "#7c5cfc";
  const isTrending = (event.prediction_count || 0) >= 10;

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}
        <div className={styles.badges}>
          <span className={styles.categoryBadge} style={{ background: catColor }}>
            {event.category}
          </span>
          {isTrending && (
            <span className={styles.trendingBadge}>
              🔥 Трендова
            </span>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <h3 className={styles.title}>
          <Link to={`/events/${event.id}`}>{event.title}</Link>
        </h3>

        {outcomes.length >= 2 && (
          <>
            <div className={styles.oddsBar}>
              <span className={styles.oddsYes}>ТАК {yesPercent}%</span>
              <span className={styles.oddsNo}>НІ {noPercent}%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressYes} style={{ width: `${yesPercent}%` }} />
              <div className={styles.progressNo} style={{ width: `${noPercent}%` }} />
            </div>
          </>
        )}

        <span className={styles.participants}>
          {(event.prediction_count || 0).toLocaleString()} учасників
        </span>
      </div>
    </div>
  );
}
