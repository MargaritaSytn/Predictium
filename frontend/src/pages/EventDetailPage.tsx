import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Users, MessageSquare, Sparkles, Flag, Share2, CalendarPlus } from "lucide-react";
import { eventService } from "../services/eventService";
import { predictionService } from "../services/predictionService";
import { reviewService } from "../services/reviewService";
import { socialService } from "../services/socialService";
import { hintService } from "../services/hintService";
import { useAuth } from "../context/AuthContext";
import { Event, EventOutcome, Review, HintResponse } from "../types";
import { AxiosError } from "axios";
import StarRating from "../components/StarRating";
import { categoryColors, categoryLabel } from "../constants/categories";
import styles from "./EventDetailPage.module.css";

interface Message {
  type: "success" | "error";
  text: string;
}

function shareEvent(title: string, eventId: number) {
  const url = `${window.location.origin}/events/${eventId}`;
  const text = `Дивись цю подію на Predictium: ${title}`;
  if (navigator.share) {
    navigator.share({ title, text, url }).catch(() => {});
  } else {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "width=600,height=400");
  }
}

function sharePrediction(title: string, outcome: string, eventId: number) {
  const url = `${window.location.origin}/events/${eventId}`;
  const text = `Я спрогнозував "${outcome}" для події "${title}" на Predictium!`;
  if (navigator.share) {
    navigator.share({ title: `Мій прогноз: ${outcome}`, text, url }).catch(() => {});
  } else {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, "_blank", "width=600,height=400");
  }
}

function addToGoogleCalendar(title: string, deadline: string, description: string) {
  const end = new Date(deadline);
  const start = new Date(end.getTime() - 60 * 60 * 1000); // 1 година до дедлайну

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Predictium: ${title} — дедлайн`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: description.slice(0, 500),
  });

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank");
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOutcome, setSelectedOutcome] = useState<EventOutcome | null>(null);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<Message | null>(null);
  const [reportingReviewId, setReportingReviewId] = useState<number | null>(null);
  const [hint, setHint] = useState<HintResponse | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const [hintsRemaining, setHintsRemaining] = useState<number | null>(null);
  const [dailyLimit, setDailyLimit] = useState<number | null>(null);
  const [lastPredictionOutcome, setLastPredictionOutcome] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    eventService.getEvent(id)
      .then((res) => setEvent(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
    reviewService.getEventReviews(id)
      .then((res) => setReviews(res.data))
      .catch(console.error);
    if (user) {
      hintService.getStatus()
        .then((res) => {
          setHintsRemaining(res.data.hints_remaining);
          setDailyLimit(res.data.daily_limit);
        })
        .catch(console.error);
    }
  }, [id, user]);

  const handlePlaceBet = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedOutcome || !amount || !event) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await predictionService.placePrediction({
        event: event.id,
        selected_outcome: selectedOutcome.id,
        amount_tokens: parseInt(amount),
      });
      setLastPredictionOutcome(selectedOutcome.label);
      setMessage({
        type: "success",
        text: `Прогноз зроблено! ${amount} токенів на «${selectedOutcome.label}» з коефіцієнтом ${res.data.locked_coefficient}x`,
      });
      setAmount("");
      setSelectedOutcome(null);
      if (id) {
        const updated = await eventService.getEvent(id);
        setEvent(updated.data);
      }
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setMessage({
        type: "error",
        text: axiosErr.response?.data?.detail || "Не вдалося зробити прогноз",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGetHint = async () => {
    if (!event || !user) return;
    setHintLoading(true);
    setHintError(null);
    setHint(null);
    try {
      const res = await hintService.getHint(event.id);
      setHint(res.data);
      setHintsRemaining(res.data.hints_remaining);
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      if (axiosErr.response?.status === 429) {
        setHintError("Ліміт підказок вичерпано на сьогодні. Оновіть до Premium для більшого доступу.");
        setHintsRemaining(0);
      } else {
        setHintError(axiosErr.response?.data?.detail || "Не вдалося отримати підказку ШІ");
      }
    } finally {
      setHintLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!id || !reviewRating) return;
    setReviewSubmitting(true);
    setReviewMsg(null);
    try {
      await reviewService.createReview(id, { rating: reviewRating, comment_text: reviewText });
      setReviewMsg({ type: "success", text: "Відгук надіслано на модерацію!" });
      setReviewRating(0);
      setReviewText("");
      const res = await reviewService.getEventReviews(id);
      setReviews(res.data);
    } catch (err) {
      const axiosErr = err as AxiosError<{ detail?: string }>;
      setReviewMsg({ type: "error", text: axiosErr.response?.data?.detail || "Не вдалося надіслати відгук" });
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) return <p className={styles.loading}>Завантаження...</p>;
  if (!event) return <p className={styles.loading}>Подію не знайдено.</p>;

  const potentialWin = selectedOutcome && amount
    ? (parseInt(amount) * selectedOutcome.current_coefficient).toFixed(0)
    : null;

  const catColors = categoryColors(event.category.toLowerCase());

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backLink}>
        <ArrowLeft size={16} /> Назад до подій
      </Link>

      <div className={styles.hero}>
        {event.image_url ? (
          <img src={event.image_url} alt={event.title} className={styles.heroImage} />
        ) : (
          <div className={styles.heroPlaceholder} />
        )}
        <div className={styles.heroOverlay}>
          <div className={styles.heroBadges}>
            <span
              className={styles.badge}
              style={{
                color: catColors.fg,
                background: catColors.bg,
                borderColor: catColors.border,
              }}
            >
              {categoryLabel(event.category)}
            </span>
            <span
              className={`${styles.badge} ${event.status === "open" ? styles.badgeOpen : styles.badgeClosed}`}
            >
              {event.status === "open" ? "Активна" : event.status}
            </span>
          </div>
          <h1 className={styles.heroTitle}>{event.title}</h1>
          <div className={styles.heroMeta}>
            <span><Calendar size={14} /> {new Date(event.deadline).toLocaleDateString("uk-UA")}</span>
            <span><Users size={14} /> {event.prediction_count || 0} прогнозів</span>
            <span><MessageSquare size={14} /> {event.review_count || 0} відгуків</span>
          </div>
          <div className={styles.heroActions}>
            <button
              className={styles.heroActionBtn}
              onClick={() => addToGoogleCalendar(event.title, event.deadline, event.description)}
              title="Додати в Google Calendar"
            >
              <CalendarPlus size={14} /> Google Calendar
            </button>
            <button className={styles.heroActionBtn} onClick={() => shareEvent(event.title, event.id)} title="Поділитися">
              <Share2 size={14} /> Поділитися
            </button>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <p className={styles.description}>{event.description}</p>

        {event.result && (
          <div className={styles.result}>Результат: {event.result}</div>
        )}

        <h2 className={styles.outcomesTitle}>
          {event.status === "open" ? "Оберіть варіант" : "Варіанти та коефіцієнти"}
        </h2>

        {event.outcomes && event.outcomes.length > 0 ? (
          <div className={styles.outcomesGrid}>
            {event.outcomes.map((outcome) => (
              <button
                key={outcome.id}
                type="button"
                className={`${styles.outcomeBtn} ${selectedOutcome?.id === outcome.id ? styles.outcomeBtnSelected : ""}`}
                onClick={() => event.status === "open" && user && setSelectedOutcome(outcome)}
                disabled={event.status !== "open" || !user}
              >
                <div className={styles.outcomeLabel}>{outcome.label}</div>
                <div className={styles.outcomeCoeff}>{outcome.current_coefficient}x</div>
                <div className={styles.outcomeWagered}>
                  {outcome.total_tokens_wagered.toLocaleString()} токенів
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.noOutcomes}>Варіанти ще не визначені.</p>
        )}

        {event.status === "open" && user && (
          <div className={styles.hintSection}>
            <div className={styles.hintHeader}>
              <span className={styles.hintTitle}>
                <Sparkles size={16} /> AI-підказка
              </span>
              {hintsRemaining !== null && (
                <span className={styles.hintBadge}>
                  {hintsRemaining} з {dailyLimit ?? (user.premium_status ? 5 : 2)} залишилось
                </span>
              )}
            </div>

            {!hint && !hintError && (
              <button
                className={styles.hintBtn}
                onClick={handleGetHint}
                disabled={hintLoading || hintsRemaining === 0}
              >
                <Sparkles size={16} />
                {hintLoading ? "Аналіз..." : "Отримати AI-аналіз"}
              </button>
            )}

            {hintError && (
              <div className={styles.hintError}>
                <p>{hintError}</p>
                {hintsRemaining === 0 && !user.premium_status && (
                  <Link to="/premium" className={styles.hintUpgradeLink}>
                    Перейти на Premium →
                  </Link>
                )}
              </div>
            )}

            {hint && (
              <div className={styles.hintPanel}>
                <p className={styles.hintText}>{hint.hint_text}</p>
                <div className={styles.hintMeta}>
                  <span>Використано підказок сьогодні: {hint.hints_used_today}</span>
                  {hint.hints_remaining > 0 && (
                    <button
                      className={styles.hintAgainBtn}
                      onClick={() => { setHint(null); setHintError(null); }}
                    >
                      Запитати знову
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {event.status === "open" && user && selectedOutcome && (
          <div className={styles.betForm}>
            <h3 className={styles.betFormTitle}>
              Прогноз на «{selectedOutcome.label}»
            </h3>
            {message && (
              <p className={message.type === "success" ? styles.successMsg : styles.errorMsg}>
                {message.text}
              </p>
            )}
            <form onSubmit={handlePlaceBet}>
              <input
                className={styles.input}
                type="number"
                min="1"
                placeholder="Кількість токенів"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              {potentialWin && (
                <p className={styles.potentialWin}>
                  Потенційний виграш: {potentialWin} токенів
                </p>
              )}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitting}
              >
                {submitting ? "Обробка..." : "Зробити прогноз"}
              </button>
            </form>
          </div>
        )}

        {lastPredictionOutcome && (
          <div className={styles.sharePrediction}>
            <span>Поділіться своїм прогнозом:</span>
            <button className={styles.shareBtn} onClick={() => sharePrediction(event.title, lastPredictionOutcome, event.id)}>
              <Share2 size={14} /> Поділитися
            </button>
            <button className={styles.shareBtn} onClick={() => {
              const url = `${window.location.origin}/events/${event.id}`;
              const text = `Я спрогнозував "${lastPredictionOutcome}" для "${event.title}"!`;
              window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank", "width=600,height=400");
            }}>X</button>
            <button className={styles.shareBtn} onClick={() => {
              const url = `${window.location.origin}/events/${event.id}`;
              const text = `Я спрогнозував "${lastPredictionOutcome}" для "${event.title}"! ${url}`;
              window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`, "_blank", "width=600,height=400");
            }}>Threads</button>
          </div>
        )}

        {event.status === "open" && !user && (
          <p className={styles.loginPrompt}>
            <Link to="/login">Увійдіть</Link>, щоб зробити прогноз
          </p>
        )}
      </div>

      <div className={styles.reviewsSection}>
        <h2 className={styles.reviewsTitle}>Відгуки ({reviews.length})</h2>

        {user && (
          <form className={styles.reviewForm} onSubmit={handleSubmitReview}>
            <div className={styles.reviewFormRow}>
              <span className={styles.reviewFormLabel}>Ваша оцінка:</span>
              <StarRating value={reviewRating} onChange={setReviewRating} />
            </div>
            <textarea
              className={styles.reviewTextarea}
              placeholder="Напишіть ваш відгук..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
            />
            {reviewMsg && (
              <p className={reviewMsg.type === "success" ? styles.successMsg : styles.errorMsg}>
                {reviewMsg.text}
              </p>
            )}
            <button
              type="submit"
              className={styles.reviewSubmitBtn}
              disabled={reviewSubmitting || !reviewRating}
            >
              {reviewSubmitting ? "Надсилання..." : "Надіслати відгук"}
            </button>
          </form>
        )}

        {reviews.length > 0 ? (
          <div className={styles.reviewList}>
            {reviews.map((review) => (
              <div key={review.id} className={styles.reviewItem}>
                <div className={styles.reviewHeader}>
                  <Link to={`/users/${review.user_id}`} className={styles.reviewUser}>{review.username}</Link>
                  <StarRating value={review.rating} readonly size={16} />
                  <span className={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString("uk-UA")}
                  </span>
                  {user && (
                    <button
                      className={styles.reviewReportBtn}
                      title="Поскаржитися"
                      onClick={async () => {
                        if (reportingReviewId === review.id) return;
                        setReportingReviewId(review.id);
                        try {
                          await socialService.createReport({ reported_review: review.id, reason: "offensive" });
                          alert("Скаргу на відгук надіслано!");
                        } catch {
                          alert("Не вдалося надіслати скаргу");
                        } finally {
                          setReportingReviewId(null);
                        }
                      }}
                      disabled={reportingReviewId === review.id}
                    >
                      <Flag size={12} />
                    </button>
                  )}
                </div>
                {review.comment_text && (
                  <p className={styles.reviewComment}>{review.comment_text}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.noReviews}>Відгуків ще немає. Будьте першим!</p>
        )}
      </div>
    </div>
  );
}
