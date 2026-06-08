import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { reviewService } from "../services/reviewService";
import { Review } from "../types";
import StarRating from "../components/StarRating";
import styles from "./ModerationPage.module.css";

export default function ModerationPage() {
  const { user, loading: authLoading } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    reviewService.getPendingReviews()
      .then((res) => setReviews(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const handleApprove = async (reviewId: number) => {
    setActionId(reviewId);
    try {
      await reviewService.approveReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch {
      alert("Помилка при затвердженні відгуку");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (reviewId: number) => {
    setActionId(reviewId);
    try {
      await reviewService.rejectReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch {
      alert("Помилка при відхиленні відгуку");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Модерація відгуків</h1>
      <p className={styles.subtitle}>Перегляд та затвердження відгуків користувачів</p>

      {loading ? (
        <p className={styles.loading}>Завантаження...</p>
      ) : reviews.length === 0 ? (
        <div className={styles.empty}>
          <p>Немає відгуків для модерації</p>
        </div>
      ) : (
        <div className={styles.list}>
          {reviews.map((review) => (
            <div key={review.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.username}>{review.username}</span>
                <StarRating value={review.rating} readonly size={18} />
              </div>
              {review.comment_text && (
                <p className={styles.comment}>{review.comment_text}</p>
              )}
              <div className={styles.cardFooter}>
                <span className={styles.date}>
                  {new Date(review.created_at).toLocaleDateString("uk-UA")}
                </span>
                <div className={styles.actions}>
                  <button
                    className={styles.approveBtn}
                    onClick={() => handleApprove(review.id)}
                    disabled={actionId === review.id}
                  >
                    Затвердити
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => handleReject(review.id)}
                    disabled={actionId === review.id}
                  >
                    Відхилити
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
