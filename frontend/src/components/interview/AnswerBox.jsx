export default function AnswerBox({
  answer,
  disabled,
  inputRef,
  onAnswerChange,
  onSubmit,
  submitting,
}) {
  return (
    <form className="answer-form" onSubmit={onSubmit}>
      <label htmlFor="answer-text">Your answer</label>
      <textarea
        ref={inputRef}
        id="answer-text"
        rows="7"
        value={answer}
        onChange={(event) => onAnswerChange(event.target.value)}
        disabled={disabled}
        placeholder="Take a breath and explain what you know..."
        aria-describedby="answer-help"
      />
      <div className="answer-form-footer">
        <span id="answer-help">You can write in your own words. Take your time.</span>
        <button className="button button-primary" type="submit" disabled={disabled || !answer.trim()}>
          {submitting ? 'Thinking...' : 'Submit answer'}
        </button>
      </div>
      {submitting && (
        <p className="thinking-message" role="status" aria-live="polite">
          TalkReady is reviewing your answer...
        </p>
      )}
    </form>
  );
}
