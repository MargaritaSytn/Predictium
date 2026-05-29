import styles from "./Skeleton.module.css";

interface SkeletonProps {
  height?: number | string;
  width?: number | string;
  radius?: string;
  className?: string;
}

export default function Skeleton({
  height = 16,
  width = "100%",
  radius = "var(--radius-md)",
  className = "",
}: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{ height, width, borderRadius: radius }}
    />
  );
}
