import { Button } from '../ui/Button/Button';
import { Input } from '../ui/Input/Input';
import styles from './SearchBar.module.scss';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
  return (
    <form
      className={styles.searchBar}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <Input
        type="search"
        inputSize="lg"
        className={styles.input}
        placeholder="Search jobs by title, company, or keyword"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Search jobs"
      />
      <Button type="submit" variant="primary" className={styles.submit}>
        Search
      </Button>
    </form>
  );
}
