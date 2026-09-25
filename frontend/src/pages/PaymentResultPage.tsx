import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import { paymentService } from "../services/paymentService";
import SuccessModal from "../components/SuccessModal";
import styles from "../styles/formPage.module.css";

type Props = { status: "success" | "cancel" };
type State = "loading" | "ok" | "error";

export default function PaymentResultPage({ status }: Props) {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<State>(status === "cancel" ? "ok" : "loading");
  const [message, setMessage] = useState("");
  const executed = useRef(false);

  const type = params.get("type");
  const orderId = params.get("token");
  const tokens = params.get("tokens");

  useEffect(() => {
    if (status === "cancel" || executed.current || authLoading || !user) return;
    if (!orderId) {
      setState("error");
      setMessage("Відсутні параметри платежу в URL.");
      return;
    }
    executed.current = true;

    const run = type === "premium"
      ? paymentService.executePremium({ order_id: orderId })
      : paymentService.executePurchase({ order_id: orderId });

    run
      .then(() => refreshUser())
      .then(() => {
        if (type === "premium") {
          navigate("/finance?paid=premium", { replace: true });
        } else {
          navigate(`/finance?paid=${tokens ?? ""}`, { replace: true });
        }
      })
      .catch((err) => {
        const axiosErr = err as AxiosError<{ detail?: string }>;
        setState("error");
        setMessage(axiosErr.response?.data?.detail || "Не вдалося завершити платіж.");
      });
  }, [status, type, orderId, tokens, authLoading, user, refreshUser, navigate]);

  if (authLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.h1}>Завантаження...</h1>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (status === "success" && state === "loading") {
    return (
      <SuccessModal
        open
        title="Завершуємо платіж..."
        description="Зачекай кілька секунд — підтверджуємо оплату в PayPal."
        buttonLabel="Зачекати"
        onClose={() => { /* no-op while loading */ }}
      />
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {status === "cancel" ? (
          <>
            <h1 className={styles.h1}>Платіж скасовано</h1>
            <p className={styles.subtitle}>Кошти не списані. Можна спробувати ще раз.</p>
          </>
        ) : (
          <>
            <h1 className={styles.h1}>Не вдалось зарахувати</h1>
            <p className={styles.error}>{message}</p>
          </>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
          <Link to="/finance" className={`${styles.btn} ${styles.btnGreen}`}>
            До фінансів
          </Link>
          <Link to="/buy-tokens" className={styles.btn}>
            Купити ще
          </Link>
          <Link to="/events" className={styles.btn}>
            До подій
          </Link>
        </div>
      </div>
    </div>
  );
}
