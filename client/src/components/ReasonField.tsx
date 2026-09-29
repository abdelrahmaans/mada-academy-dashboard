import type { ChangeEvent } from "react";

export type ReasonFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helper?: string;
  maxLength?: number;
  required?: boolean;
  rows?: number;
};

export default function ReasonField({
  id,
  label,
  value,
  onChange,
  placeholder,
  helper,
  maxLength = 240,
  required = false,
  rows = 3,
}: ReasonFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <label
      className={`reason-field ${required ? "reason-field-required" : ""}`}
      htmlFor={id}
    >
      <span className="reason-field-label">
        {label} {required && <b aria-hidden="true">*</b>}
        {helper && <small>{helper}</small>}
      </span>
      <textarea
        id={id}
        value={value}
        onChange={handleChange}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        required={required}
        aria-required={required}
        aria-describedby={`${id}-counter`}
      />
      <small id={`${id}-counter`} className="reason-field-counter">
        {value.length}/{maxLength}
      </small>
    </label>
  );
}
