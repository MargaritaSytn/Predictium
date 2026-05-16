import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { eventService } from "../services/eventService";
import { predictionService } from "../services/predictionService";
import { reviewService } from "../services/reviewService";
import { socialService } from "../services/socialService";
import { hintService } from "../services/hintService";
import { useAuth } from "../context/AuthContext";
import { Event, EventOutcome, Review, HintResponse } from "../types";
import { AxiosError } from "axios";
import StarRating from "../components/StarRating";
import styles from "./EventDetailPage.module.css";

interface Message {
  type: "success" | "error";
  text: string;
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
        .then((res) => setHintsRemaining(res.data.hints_remaining))
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
      setMessage({
        type: "success",
        text: `Прогноз зроблено! ${amount} токенів на "${selectedOutcome.label}" з коефіцієнтом ${res.data.locked_coefficient}x`,
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

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backLink}>← Назад до подій</Link>

      {event.image_url ? (
        <img src={event.image_url} alt={event.title} className={styles.heroImage} />
      ) : (
        <div className={styles.heroPlaceholder} />
      )}

      <div className={styles.card}>
        <div className={styles.badges}>
          <span className={`${styles.badge} ${styles.badgeCategory}`}>
            {event.category}
          </span>
          <span className={`${styles.badge} ${event.status === "open" ? styles.badgeOpen : styles.badgeClosed}`}>
            {event.status === "open" ? "Активна" : event.status}
          </span>
        </div>

        <h1 className={styles.title}>{event.title}</h1>
        <p className={styles.description}>{event.description}</p>

        <div className={styles.meta}>
          <span>📅 Дедлайн: {new Date(event.deadline).toLocaleDateString("uk-UA")}</span>
          <span>📊 {event.prediction_count || 0} прогнозів</span>
          <span>💬 {event.review_count || 0} відгуків</span>
        </div>

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
              <span className={styles.hintTitle}>AI-підказка</span>
              {hintsRemaining !== null && (
                <span className={styles.hintBadge}>
                  {hintsRemaining} з {user.premium_status ? "5" : "1"} залишилось
                </span>
              )}
            </div>

            {!hint && !hintError && (
              <button
                className={styles.hintBtn}
                onClick={handleGetHint}
                disabled={hintLoading || hintsRemaining === 0}
              >
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
              Прогноз на &laquo;{selectedOutcome.label}&raquo;
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
                  <Link to={`/users/${review.id}`} className={styles.reviewUser}>{review.username}</Link>
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
                      ⚑
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
