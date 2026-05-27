import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { AxiosError } from "axios";
import { useAuth } from "../context/AuthContext";
import { paymentService } from "../services/paymentService";
import styles from "../styles/formPage.module.css";

type Props = { status: "success" | "cancel" };
type State = "loading" | "ok" | "error";

export default function PaymentResultPage({ status }: Props) {
  const { user, refreshUser } = useAuth();
  const [params] = useSearchParams();
  const [state, setState] = useState<State>(status === "cancel" ? "ok" : "loading");
  const [message, setMessage] = useState("");
  const executed = useRef(false);

  const type = params.get("type");
  const paymentId = params.get("paymentId");
  const payerId = params.get("PayerID");
  const tokens = params.get("tokens");

  useEffect(() => {
    if (status === "cancel" || executed.current) return;
    if (!paymentId || !payerId) {
      setState("error");
      setMessage("Відсутні параметри платежу в URL.");
      return;
    }
    executed.current = true;

    const run = type === "premium"
      ? paymentService.executePremium({ payment_id: paymentId, payer_id: payerId })
      : paymentService.executePurchase({ payment_id: paymentId, payer_id: payerId });

    run
      .then(() => refreshUser())
      .then(() => {
        setState("ok");
        setMessage(
          type === "premium"
            ? "Преміум-підписку активовано на 30 днів."
            : `Зараховано ${tokens ?? ""} токенів на ваш баланс.`
        );
      })
      .catch((err) => {
        const axiosErr = err as AxiosError<{ detail?: string }>;
        setState("error");
        setMessage(axiosErr.response?.data?.detail || "Не вдалося завершити платіж.");
      });
  }, [status, type, paymentId, payerId, tokens, refreshUser]);

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {status === "cancel" ? (
          <>
            <h1 className={styles.h1}>Платіж скасовано</h1>
            <p className={styles.subtitle}>Кошти не списані. Можеш спробувати ще раз.</p>
          </>
        ) : state === "loading" ? (
          <>
            <h1 className={styles.h1}>Завершуємо платіж...</h1>
            <p className={styles.subtitle}>Зачекай кілька секунд — підтверджуємо оплату в PayPal.</p>
          </>
        ) : state === "ok" ? (
          <>
            <h1 className={styles.h1}>Готово!</h1>
            <p className={styles.subtitle}>{message}</p>
            <p className={styles.subtitle}>
              Поточний баланс: <strong>{user.wallet_balance.toLocaleString()} токенів</strong>
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.h1}>Не вдалось зарахувати</h1>
            <p className={styles.error}>{message}</p>
          </>
        )}

        {state !== "loading" && (
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
        )}
      </div>
    </div>
  );
}
