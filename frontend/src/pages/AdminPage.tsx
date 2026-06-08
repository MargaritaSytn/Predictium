import { useState, useEffect, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../services/adminService";
import { Event, EventOutcome, PlatformStats, PeriodKey, TimeSeriesPoint } from "../types";
import { CATEGORIES, categoryLabel } from "../constants/categories";
import BarChart from "../components/BarChart";
import styles from "./AdminPage.module.css";

const STATUSES = ["draft", "open", "closed", "resolving", "completed"];

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "7d",  label: "7 днів"   },
  { key: "30d", label: "30 днів"  },
  { key: "90d", label: "90 днів"  },
  { key: "all", label: "Весь час" },
];

const PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

const CATEGORY_LABELS: Record<string, string> = {
  sports: "Спорт", politics: "Політика", technology: "Технології",
  crypto: "Крипто", space: "Космос",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Активних", won: "Виграно", lost: "Програно",
  locked: "Закрито", cancelled: "Скасовано",
};

function fillGaps(series: TimeSeriesPoint[], days: number): TimeSeriesPoint[] {
  const today = new Date();
  const map = new Map(series.map((p) => [p.date, p.count]));
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: map.get(key) ?? 0 };
  });
}

function formatDateLabel(raw: string): string {
  const d = new Date(raw);
  return `${d.getDate()}.${d.getMonth() + 1}`;
}

const emptyForm = {
  title: "",
  description: "",
  category: "sports",
  image_url: "",
  deadline: "",
  status: "draft",
  outcomes: ["", ""],
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [outcomeInput, setOutcomeInput] = useState<Record<number, string>>({});

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>("30d");

  useEffect(() => {
    if (!showStats) return;
    setStatsLoading(true);
    adminService.getStats(period)
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, [showStats, period]);

  const loadEvents = useCallback(() => {
    setLoading(true);
    adminService.getEvents(page)
      .then((res) => {
        setEvents(res.data.results);
        setTotalEvents(res.data.count);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_staff) return <Navigate to="/" replace />;

  const handleOutcomeChange = (idx: number, value: string) => {
    setForm((f) => {
      const outcomes = [...f.outcomes];
      outcomes[idx] = value;
      return { ...f, outcomes };
    });
  };

  const addOutcomeField = () => setForm((f) => ({ ...f, outcomes: [...f.outcomes, ""] }));
  const removeOutcomeField = (idx: number) =>
    setForm((f) => ({ ...f, outcomes: f.outcomes.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const filledOutcomes = form.outcomes.map((o) => o.trim()).filter(Boolean);
    if (filledOutcomes.length < 2) {
      setFormError("Потрібно щонайменше 2 варіанти відповіді.");
      return;
    }
    setSubmitting(true);
    try {
      await adminService.createEvent({
        ...form,
        outcomes: filledOutcomes,
        image_url: form.image_url || undefined,
      });
      setShowForm(false);
      setForm(emptyForm);
      loadEvents();
    } catch {
      setFormError("Помилка при створенні події.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (event: Event, newStatus: string) => {
    try {
      await adminService.updateEvent(event.id, { status: newStatus });
      loadEvents();
    } catch {
      alert("Помилка при оновленні статусу.");
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!confirm("Видалити цю подію?")) return;
    try {
      await adminService.deleteEvent(eventId);
      loadEvents();
    } catch {
      alert("Помилка при видаленні події.");
    }
  };

  const handleAddOutcome = async (eventId: number) => {
    const label = (outcomeInput[eventId] || "").trim();
    if (!label) return;
    try {
      await adminService.addOutcome(eventId, label);
      setOutcomeInput((prev) => ({ ...prev, [eventId]: "" }));
      loadEvents();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(msg || "Помилка при додаванні варіанту.");
    }
  };

  const handleDeleteOutcome = async (outcome: EventOutcome) => {
    if (!confirm(`Видалити варіант "${outcome.label}"?`)) return;
    try {
      await adminService.deleteOutcome(outcome.id);
      loadEvents();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(msg || "Помилка при видаленні варіанту.");
    }
  };

  const totalPages = Math.ceil(totalEvents / 10);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>Управління подіями</h1>
          <p className={styles.subtitle}>Усього подій: {totalEvents}</p>
        </div>
        <div className={styles.headerActions}>
          <button
            className={`${styles.statsLink} ${showStats ? styles.statsLinkActive : ""}`}
            onClick={() => setShowStats((v) => !v)}
          >
            📊 {showStats ? "Сховати статистику" : "Показати статистику"}
          </button>
          <Link to="/admin/analytics" className={styles.statsLink}>Детальна аналітика</Link>
          <button className={styles.createBtn} onClick={() => { setShowForm(!showForm); setFormError(""); }}>
            {showForm ? "Скасувати" : "+ Нова подія"}
          </button>
        </div>
      </div>

      {showStats && (
        <div className={styles.statsPanel}>
          {statsLoading ? (
            <p className={styles.loading}>Завантаження статистики...</p>
          ) : stats ? (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>Всього користувачів</p>
                  <p className={styles.statValue}>{stats.users.total}</p>
                  <p className={styles.statSub}>Premium: {stats.users.premium}</p>
                </div>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>Відкритих подій</p>
                  <p className={styles.statValue}>{stats.events.open}</p>
                  <p className={styles.statSub}>Всього: {stats.events.total} · Завершено: {stats.events.completed}</p>
                </div>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>Прогнозів</p>
                  <p className={styles.statValue}>{stats.predictions.total.toLocaleString()}</p>
                  <p className={styles.statSub}>{stats.predictions.total_tokens_wagered.toLocaleString()} токенів у ставках</p>
                </div>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>Виручка (USD)</p>
                  <p className={`${styles.statValue} ${styles.statValueGreen}`}>${stats.revenue.total_purchases_usd.toFixed(2)}</p>
                  <p className={styles.statSub}>
                    Нетто:{" "}
                    <span className={stats.revenue.net_usd >= 0 ? styles.positive : styles.negative}>
                      ${stats.revenue.net_usd.toFixed(2)}
                    </span>
                  </p>
                </div>
              </div>

              <div className={styles.periodBar}>
                {PERIODS.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`${styles.periodBtn} ${period === key ? styles.periodBtnActive : ""}`}
                    onClick={() => setPeriod(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className={styles.activeUsersCard}>
                <div>
                  <p className={styles.statLabel}>Активних користувачів</p>
                  <p className={styles.statValue}>{stats.activity.active_users.toLocaleString()}</p>
                </div>
                <p className={styles.statSub}>
                  Заходили за{" "}
                  {period === "all" ? "весь час" : `останні ${period.replace("d", " днів")}`}
                </p>
              </div>

              <div className={styles.chartsRow}>
                <BarChart
                  data={PERIOD_DAYS[period]
                    ? fillGaps(stats.activity.registrations_series, PERIOD_DAYS[period])
                    : stats.activity.registrations_series}
                  labelKey="date"
                  color="var(--accent)"
                  title="Реєстрації"
                  height={160}
                  formatLabel={formatDateLabel}
                />
                <BarChart
                  data={PERIOD_DAYS[period]
                    ? fillGaps(stats.activity.predictions_series, PERIOD_DAYS[period])
                    : stats.activity.predictions_series}
                  labelKey="date"
                  color="var(--success)"
                  title="Прогнози"
                  height={160}
                  formatLabel={formatDateLabel}
                />
              </div>

              {stats.activity.predictions_by_category.length > 0 && (
                <BarChart
                  data={stats.activity.predictions_by_category}
                  labelKey="category"
                  orientation="horizontal"
                  title="Прогнози за категоріями"
                  height={Math.max(100, stats.activity.predictions_by_category.length * 36 + 16)}
                  formatLabel={(cat) => CATEGORY_LABELS[cat] ?? cat}
                />
              )}

              <div className={styles.votingSection}>
                <h3 className={styles.votingTitle}>Активність голосувань</h3>
                <div className={styles.statusGrid}>
                  {(Object.entries(stats.activity.predictions_by_status) as [string, number][]).map(([key, count]) => (
                    <div key={key} className={styles.statusCard}>
                      <p className={styles.statusLabel}>{STATUS_LABELS[key] ?? key}</p>
                      <p className={styles.statusValue}>{count.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h2 className={styles.formTitle}>Нова подія</h2>
          {formError && <p className={styles.error}>{formError}</p>}
          <div className={styles.formGrid}>
            <label className={styles.label}>
              Назва*
              <input className={styles.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </label>
            <label className={styles.label}>
              Категорія*
              <select className={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
            <label className={styles.label}>
              Дедлайн*
              <input type="datetime-local" className={styles.input} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} required />
            </label>
            <label className={styles.label}>
              Статус
              <select className={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <label className={styles.label}>
            Опис*
            <textarea className={styles.textarea} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} />
          </label>
          <label className={styles.label}>
            URL зображення
            <input className={styles.input} value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
          </label>
          <div className={styles.outcomesSection}>
            <p className={styles.outcomesLabel}>Варіанти відповіді (мін. 2)</p>
            {form.outcomes.map((o, idx) => (
              <div key={idx} className={styles.outcomeRow}>
                <input
                  className={styles.input}
                  value={o}
                  onChange={(e) => handleOutcomeChange(idx, e.target.value)}
                  placeholder={`Варіант ${idx + 1}`}
                />
                {form.outcomes.length > 2 && (
                  <button type="button" className={styles.removeBtn} onClick={() => removeOutcomeField(idx)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className={styles.addOutcomeBtn} onClick={addOutcomeField}>+ Додати варіант</button>
          </div>
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? "Створення..." : "Створити подію"}
          </button>
        </form>
      )}

      {loading ? (
        <p className={styles.loading}>Завантаження...</p>
      ) : events.length === 0 ? (
        <p className={styles.empty}>Подій немає.</p>
      ) : (
        <>
          <div className={styles.eventList}>
            {events.map((event) => (
              <div key={event.id} className={`${styles.eventCard} ${editingEvent?.id === event.id ? styles.eventCardExpanded : ""}`}>
                <div className={styles.eventHeader}>
                  <div className={styles.eventMeta}>
                    <span className={`${styles.statusBadge} ${styles[`status_${event.status}`]}`}>{event.status}</span>
                    <span className={styles.eventCategory}>{categoryLabel(event.category)}</span>
                  </div>
                  <div className={styles.eventActions}>
                    <select
                      className={styles.statusSelect}
                      value={event.status}
                      onChange={(e) => handleStatusChange(event, e.target.value)}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                      className={styles.expandBtn}
                      onClick={() => setEditingEvent(editingEvent?.id === event.id ? null : event)}
                    >
                      {editingEvent?.id === event.id ? "Згорнути" : "Варіанти"}
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(event.id)}>Видалити</button>
                  </div>
                </div>
                <h3 className={styles.eventTitle}>{event.title}</h3>
                <p className={styles.eventDeadline}>
                  Дедлайн: {new Date(event.deadline).toLocaleString("uk-UA")}
                  {event.prediction_count !== undefined && ` · ${event.prediction_count} прогнозів`}
                </p>

                {editingEvent?.id === event.id && (
                  <div className={styles.outcomesManage}>
                    <p className={styles.outcomesLabel}>Варіанти відповіді:</p>
                    {(event.outcomes || []).map((outcome) => (
                      <div key={outcome.id} className={styles.outcomeManageRow}>
                        <span>{outcome.label}</span>
                        <span className={styles.outcomeMeta}>{outcome.total_tokens_wagered} токенів</span>
                        <button
                          className={styles.removeBtn}
                          onClick={() => handleDeleteOutcome(outcome)}
                        >✕</button>
                      </div>
                    ))}
                    <div className={styles.addOutcomeRow}>
                      <input
                        className={styles.input}
                        placeholder="Новий варіант"
                        value={outcomeInput[event.id] || ""}
                        onChange={(e) => setOutcomeInput((prev) => ({ ...prev, [event.id]: e.target.value }))}
                      />
                      <button className={styles.addOutcomeBtn} onClick={() => handleAddOutcome(event.id)}>
                        Додати
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className={styles.pageBtn}>← Назад</button>
              <span className={styles.pageInfo}>{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className={styles.pageBtn}>Вперед →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
