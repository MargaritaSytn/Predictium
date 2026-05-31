import { useState, useEffect } from "react";
import { eventService } from "../services/eventService";
import { Event } from "../types";
import { categoryLabel } from "../constants/categories";
import EventCard from "../components/EventCard";
import Sidebar from "../components/Sidebar";
import Skeleton from "../components/Skeleton";
import styles from "./HomePage.module.css";

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { status: "open" };
    if (category) params.category = category;

    eventService.getEvents(params)
      .then((res) => setEvents(res.data.results))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  const subtitle = category
    ? `${events.length} подій у категорії «${categoryLabel(category)}»`
    : `${events.length} подій доступно`;

  return (
    <div className={styles.page}>
      <Sidebar activeCategory={category} onCategoryChange={setCategory} />

      <div className={styles.mainContent}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.heading}>Активні події</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          {category && (
            <button
              type="button"
              className={styles.resetButton}
              onClick={() => setCategory("")}
            >
              × Скинути фільтр
            </button>
          )}
        </header>

        {loading ? (
          <div className={styles.eventsGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={340} radius="var(--radius-lg)" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className={styles.eventsGrid}>
            {events.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        ) : (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Подій не знайдено</p>
            <p className={styles.emptyHint}>
              {category
                ? `У категорії «${categoryLabel(category)}» наразі немає активних подій`
                : "Завітайте трохи пізніше"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
