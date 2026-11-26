import Button from '../common/Button.jsx';

const labels = {
  nudge: 'Get a nudge',
  clue: 'Ask for a clue',
  answer: 'Show an answer',
  done: 'No more hints',
};

export default function HintButton({ disabled, level, onClick }) {
  return (
    <Button
      className="hint-button"
      variant="secondary"
      disabled={disabled || level === 'done'}
      onClick={onClick}
    >
      {labels[level] || labels.nudge}
    </Button>
  );
}
