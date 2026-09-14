import { useState } from 'react';

import { Button } from '../ui/Button/Button';
import { Input } from '../ui/Input/Input';
import { Select } from '../ui/Select/Select';
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

function FilterFields({
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
    <>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Source</h3>
        <Select value={source} onChange={(event) => onSourceChange(event.target.value)} aria-label="Source">
          <option value="">All sources</option>
          <option value="mycareersfuture">MyCareersFuture</option>
          <option value="adzuna">Adzuna</option>
          <option value="jobicy">Jobicy</option>
          <option value="linkedin">LinkedIn</option>
        </Select>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Salary</h3>
        <div className={styles.fieldGroup}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Min (SGD)</span>
            <Input
              type="number"
              value={salaryMin}
              onChange={(event) => onSalaryMinChange(event.target.value)}
              placeholder="e.g. 3000"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Max (SGD)</span>
            <Input
              type="number"
              value={salaryMax}
              onChange={(event) => onSalaryMaxChange(event.target.value)}
              placeholder="e.g. 8000"
            />
          </label>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Location</h3>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>District or region</span>
          <Input
            type="text"
            value={location}
            onChange={(event) => onLocationChange(event.target.value)}
            placeholder="e.g. Central, East"
          />
        </label>
      </section>

      <Button type="button" variant="primary" className={styles.applyButton} onClick={onApply}>
        Apply filters
      </Button>
    </>
  );
}

export function FilterPanel(props: FilterPanelProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleApply = () => {
    props.onApply();
    setDrawerOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className={styles.mobileToggle}
        onClick={() => setDrawerOpen(true)}
        aria-expanded={drawerOpen}
        aria-controls="filter-drawer"
      >
        Filters
      </Button>

      <aside className={styles.panel}>
        <h2 className={styles.panelTitle}>Filters</h2>
        <FilterFields {...props} onApply={handleApply} />
      </aside>

      {drawerOpen && (
        <div className={styles.drawerBackdrop} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      )}

      <aside
        id="filter-drawer"
        className={[styles.drawer, drawerOpen ? styles.drawerOpen : ''].filter(Boolean).join(' ')}
        aria-hidden={!drawerOpen}
        aria-label="Filters"
      >
        <div className={styles.drawerHeader}>
          <h2 className={styles.panelTitle}>Filters</h2>
          <Button
            type="button"
            variant="ghost"
            className={styles.drawerClose}
            onClick={() => setDrawerOpen(false)}
            aria-label="Close filters"
          >
            Close
          </Button>
        </div>
        <FilterFields {...props} onApply={handleApply} />
      </aside>
    </>
  );
}
