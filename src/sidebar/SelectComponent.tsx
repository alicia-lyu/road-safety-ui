import React, { ChangeEvent } from 'react';
import styles from '@/sidebar/SelectComponent.module.css';
interface Option {
  value: string;
  label: string;
}

interface SafetyPathSelectProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

const SafetyPathSelect: React.FC<SafetyPathSelectProps> = ({ label, value, options, onChange }) => {
  return (
    <div className={styles.safetyPathSelectContainer}>
      <label className={styles.label}>
        {label}:
        <select className={styles.select} value={value} onChange={onChange}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};

export default SafetyPathSelect;
