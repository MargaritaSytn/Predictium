import { useState } from "react";
import styles from "../../styles/authPage.module.css";

interface Props {
  onSuccess: (accessToken: string) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
}

const appId = import.meta.env.VITE_FACEBOOK_APP_ID as string | undefined;

// Minimal typing for the Facebook JS SDK globals we use.
declare global {
  interface Window {
    FB?: {
      init: (params: Record<string, unknown>) => void;
      login: (
        cb: (resp: { authResponse?: { accessToken?: string } | null }) => void,
        opts?: { scope?: string }
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

let sdkPromise: Promise<void> | null = null;

function loadFbSdk(): Promise<void> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve) => {
    if (window.FB) {
      resolve();
      return;
    }
    window.fbAsyncInit = () => {
      window.FB!.init({ appId, cookie: true, xfbml: false, version: "v21.0" });
      resolve();
    };
    const js = document.createElement("script");
    js.id = "facebook-jssdk";
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    js.async = true;
    js.defer = true;
    document.body.appendChild(js);
  });
  return sdkPromise;
}

function FacebookIcon() {
  return (
    <svg
      className={styles.socialIconFacebook}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="currentColor"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

export default function FacebookButton({ onSuccess, onError, disabled }: Props) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (!appId) {
      onError("Facebook login не налаштовано (VITE_FACEBOOK_APP_ID)");
      return;
    }
    setBusy(true);
    try {
      await loadFbSdk();
      window.FB!.login(
        (resp) => {
          setBusy(false);
          const token = resp.authResponse?.accessToken;
          if (token) {
            onSuccess(token);
          } else {
            onError("Не вдалось увійти через Facebook");
          }
        },
        { scope: "public_profile,email" }
      );
    } catch {
      setBusy(false);
      onError("Не вдалось завантажити Facebook SDK");
    }
  };

  return (
    <button
      type="button"
      className={styles.socialBtn}
      onClick={handleClick}
      disabled={disabled || busy}
    >
      <FacebookIcon />
      Продовжити з Facebook
    </button>
  );
}
