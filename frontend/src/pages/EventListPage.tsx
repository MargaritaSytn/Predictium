import { useState, useEffect } from "react";
import { eventService } from "../services/eventService";
import { Event } from "../types";
import EventCard from "../components/EventCard";
import Sidebar from "../components/Sidebar";
import styles from "./HomePage.module.css";

export default function EventListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (category) params.category = category;
    eventService.getEvents(params)
      .then((res) => setEvents(res.data.results))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className={styles.page}>
      <Sidebar activeCategory={category} onCategoryChange={setCategory} />

      <div className={styles.mainContent}>
        <h1 className={styles.heading}>Каталог подій</h1>
        <p className={styles.subtitle}>Всі доступні події для прогнозування</p>

        {loading ? (
          <p className={styles.loading}>Завантаження...</p>
        ) : (
          <div className={styles.eventsGrid}>
            {events.length > 0 ? (
              events.map((event) => <EventCard key={event.id} event={event} />)
            ) : (
              <p className={styles.empty}>Подій не знайдено</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
