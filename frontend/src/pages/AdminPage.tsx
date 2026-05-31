import { useState, useEffect, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminService } from "../services/adminService";
import { Event, EventOutcome } from "../types";
import { CATEGORIES, categoryLabel } from "../constants/categories";
import styles from "./AdminPage.module.css";

const STATUSES = ["draft", "open", "closed", "resolving", "completed"];

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
  const { user } = useAuth();
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
          <Link to="/admin/analytics" className={styles.statsLink}>📊 Аналітика</Link>
          <button className={styles.createBtn} onClick={() => { setShowForm(!showForm); setFormError(""); }}>
            {showForm ? "Скасувати" : "+ Нова подія"}
          </button>
        </div>
      </div>

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
