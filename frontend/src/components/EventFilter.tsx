import { CSSProperties } from "react";

const categories = ["crypto", "sports", "politics", "entertainment", "technology", "weather"];

const styles: Record<string, CSSProperties> = {
  container: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
    marginBottom: "1.5rem",
  },
  btn: {
    padding: "0.4rem 1rem",
    borderRadius: "20px",
    border: "1px solid #2a2a4a",
    background: "transparent",
    color: "#b0b0c0",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  active: {
    background: "#7c5cfc",
    color: "#fff",
    borderColor: "#7c5cfc",
  },
};

interface EventFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

export default function EventFilter({ selected, onChange }: EventFilterProps) {
  return (
    <div style={styles.container}>
      <button
        onClick={() => onChange("")}
        style={{ ...styles.btn, ...(!selected ? styles.active : {}) }}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          style={{ ...styles.btn, ...(selected === cat ? styles.active : {}) }}
        >
          {cat.charAt(0).toUpperCase() + cat.slice(1)}
        </button>
      ))}
    </div>
  );
}
