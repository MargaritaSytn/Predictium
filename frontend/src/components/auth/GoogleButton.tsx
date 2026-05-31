import { useGoogleLogin } from "@react-oauth/google";
import styles from "../../styles/authPage.module.css";

interface Props {
  onSuccess: (accessToken: string) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}

function GoogleIcon() {
  return (
    <svg
      className={styles.socialIconGoogle}
      aria-hidden="true"
      focusable="false"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 488 512"
    >
      <path
        fill="currentColor"
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
      />
    </svg>
  );
}

function EnabledGoogleButton({ onSuccess, onError, disabled }: Props) {
  const login = useGoogleLogin({
    flow: "implicit",
    onSuccess: (resp) => onSuccess(resp.access_token),
    onError: () => onError("Не вдалось увійти через Google"),
  });

  return (
    <button
      type="button"
      className={styles.socialBtn}
      onClick={() => login()}
      disabled={disabled}
    >
      <GoogleIcon />
      Продовжити з Google
    </button>
  );
}

export default function GoogleButton(props: Props) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return (
      <button
        type="button"
        className={styles.socialBtn}
        onClick={() => props.onError("Google login не налаштовано (VITE_GOOGLE_CLIENT_ID)")}
        disabled={props.disabled}
        title="Налаштуйте VITE_GOOGLE_CLIENT_ID у frontend/.env"
      >
        <GoogleIcon />
        Продовжити з Google
      </button>
    );
  }
  return <EnabledGoogleButton {...props} />;
}
