import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <span className={styles.copyright}>
        &copy; 2026 Predictium. Всі права захищено.
      </span>

      <div className={styles.socialLinks}>
        <a href="#" className={styles.socialLink} aria-label="Twitter">
          𝕏
        </a>
        <a href="#" className={styles.socialLink} aria-label="Chat">
          💬
        </a>
        <a href="#" className={styles.socialLink} aria-label="Bookmark">
          🔖
        </a>
        <a href="#" className={styles.socialLink} aria-label="Email">
          ✉
        </a>
      </div>

      <span className={styles.phone}>+380(XX)-XXX-XX-XX</span>
    </footer>
  );
}
