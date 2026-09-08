import styles from './FilterPanel.module.scss';

interface FilterPanelProps {
  salaryMin: string;
  salaryMax: string;
  location: string;
  source: string;
  onSalaryMinChange: (value: string) => void;
  onSalaryMaxChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onApply: () => void;
}

export function FilterPanel({
  salaryMin,
  salaryMax,
  location,
  source,
  onSalaryMinChange,
  onSalaryMaxChange,
  onLocationChange,
  onSourceChange,
  onApply,
}: FilterPanelProps) {
  return (
    <aside className={styles.panel}>
      <h2>Filters</h2>
      <label>
        Source
        <select value={source} onChange={(event) => onSourceChange(event.target.value)}>
          <option value="">All sources</option>
          <option value="mycareersfuture">MyCareersFuture</option>
          <option value="adzuna">Adzuna</option>
        </select>
      </label>
      <label>
        Min salary (SGD)
        <input
          type="number"
          value={salaryMin}
          onChange={(event) => onSalaryMinChange(event.target.value)}
          placeholder="e.g. 3000"
        />
      </label>
      <label>
        Max salary (SGD)
        <input
          type="number"
          value={salaryMax}
          onChange={(event) => onSalaryMaxChange(event.target.value)}
          placeholder="e.g. 8000"
        />
      </label>
      <label>
        Location
        <input
          type="text"
          value={location}
          onChange={(event) => onLocationChange(event.target.value)}
          placeholder="District or region"
        />
      </label>
      <button type="button" onClick={onApply}>Apply filters</button>
    </aside>
  );
}
