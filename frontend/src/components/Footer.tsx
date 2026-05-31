import { Link } from "react-router-dom";
import { Send, MessageCircle, Code2, Mail } from "lucide-react";
import styles from "./Footer.module.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const platformLinks = [
    { label: "Головна", path: "/" },
    { label: "Профіль", path: "/profile" },
    { label: "Фінанси", path: "/finance" },
  ];

  const resourcesLinks = [
    { label: "Документація", path: "#" },
    { label: "API", path: "#" },
    { label: "Підтримка", path: "#" },
  ];

  const legalLinks = [
    { label: "Умови користування", path: "#" },
    { label: "Політика конфіденційності", path: "#" },
    { label: "Правила прогнозів", path: "#" },
  ];

  const socialLinks = [
    { Icon: Send, label: "X / Twitter", href: "#" },
    { Icon: MessageCircle, label: "Telegram", href: "#" },
    { Icon: Code2, label: "GitHub", href: "#" },
    { Icon: Mail, label: "Email", href: "mailto:support@predictium.com" },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <div className={styles.brandRow}>
              <span className={styles.logoIcon}>P</span>
              <span className={`${styles.logoText} gradient-text`}>Predictium</span>
            </div>
            <p className={styles.brandDescription}>
              Преміальна платформа для прогнозів з технологіями штучного інтелекту
            </p>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Платформа</h3>
            <ul className={styles.linkList}>
              {platformLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Ресурси</h3>
            <ul className={styles.linkList}>
              {resourcesLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.path} className={styles.link}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Правова інформація</h3>
            <ul className={styles.linkList}>
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.path} className={styles.link}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <div className={styles.dividerGlow} />
        </div>

        <div className={styles.bottomRow}>
          <div className={styles.copyright}>
            © {currentYear} Predictium. Всі права захищено.
          </div>

          <div className={styles.socials}>
            {socialLinks.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className={styles.socialLink}
              >
                <Icon size={16} strokeWidth={1.75} />
              </a>
            ))}
          </div>

          <div className={styles.status}>
            <span className={styles.statusDot} />
            <span>Система активна</span>
          </div>
        </div>
      </div>

      <div className={styles.bottomAccent} />
    </footer>
  );
}
