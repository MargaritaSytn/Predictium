import { ReactNode } from "react";
import { Check } from "lucide-react";
import Modal from "./Modal";
import styles from "./SuccessModal.module.css";

interface SuccessModalProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  subtext?: ReactNode;
  buttonLabel?: string;
  onClose: () => void;
}

export default function SuccessModal({
  open,
  title,
  description,
  subtext,
  buttonLabel = "Чудово!",
  onClose,
}: SuccessModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.body}>
        <div className={styles.iconRing}>
          <Check size={28} strokeWidth={2.5} />
        </div>
        <h2 className={styles.title}>{title}</h2>
        {description && <p className={styles.description}>{description}</p>}
        {subtext && <p className={styles.subtext}>{subtext}</p>}
        <button type="button" className={styles.button} onClick={onClose}>
          {buttonLabel}
        </button>
      </div>
    </Modal>
  );
}
