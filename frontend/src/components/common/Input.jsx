export default function Input({ error, id, label, ...props }) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        {...props}
      />
      {error && <span className="field-error" id={errorId}>{error}</span>}
    </div>
  );
}
