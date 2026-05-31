import { useState, useEffect } from "react";
import { eventService } from "../services/eventService";
import { Event } from "../types";
import EventCard from "../components/EventCard";
import Sidebar from "../components/Sidebar";
import styles from "./EventListPage.module.css";

export default function EventListPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    setEvents([]);
    setPage(1);

    const params: Record<string, string | number> = { page: 1 };
    if (category) params.category = category;

    eventService
      .getEvents(params)
      .then((res) => {
        setEvents(res.data.results);
        setHasMore(res.data.next !== null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category]);

  const loadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);

    const params: Record<string, string | number> = { page: nextPage };
    if (category) params.category = category;

    eventService
      .getEvents(params)
      .then((res) => {
        setEvents((prev) => [...prev, ...res.data.results]);
        setHasMore(res.data.next !== null);
        setPage(nextPage);
      })
      .catch(console.error)
      .finally(() => setLoadingMore(false));
  };

  return (
    <div className={styles.page}>
      <Sidebar activeCategory={category} onCategoryChange={setCategory} />

      <div className={styles.mainContent}>
        <h1 className={styles.heading}>Каталог подій</h1>
        <p className={styles.subtitle}>Всі доступні події для прогнозування</p>

        {loading ? (
          <p className={styles.loading}>Завантаження...</p>
        ) : (
          <>
            <div className={styles.eventsGrid}>
              {events.length > 0 ? (
                events.map((event) => <EventCard key={event.id} event={event} />)
              ) : (
                <p className={styles.empty}>Подій не знайдено</p>
              )}
            </div>

            {hasMore && (
              <div className={styles.loadMoreWrapper}>
                <button
                  className={styles.loadMoreButton}
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Завантаження..." : "Завантажити ще"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
