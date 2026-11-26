export default function QuestionCard({ question }) {
  const text = typeof question === 'string'
    ? question
    : question?.text ?? question?.question_text;
  const type = typeof question === 'object'
    ? question?.type ?? question?.questionType ?? question?.question_type
    : null;

  return (
    <section className="question-card" aria-labelledby="question-title">
      <div className="question-card-top">
        <span className="question-number-label">Current question</span>
        {type && <span className="question-type">{type.replaceAll('_', ' ')}</span>}
      </div>
      <h2 id="question-title">{text || 'The next question is loading...'}</h2>
    </section>
  );
}
