import { Component, ErrorInfo, ReactNode } from "react";
import styles from "./ErrorBoundary.module.css";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.logo}>P</div>
            <h1 className={styles.title}>Щось пішло не так</h1>
            <p className={styles.message}>
              Сталася неочікувана помилка. Спробуйте оновити сторінку.
            </p>
            {this.state.error?.message && (
              <p className={styles.errorDetail}>{this.state.error.message}</p>
            )}
            <button type="button" onClick={this.handleReload} className={styles.button}>
              Оновити сторінку
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
