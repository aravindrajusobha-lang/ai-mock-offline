import { Link } from 'react-router-dom';
import PageFrame from '../components/layout/PageFrame.jsx';

export default function HomePage() {
  return (
    <PageFrame>
      <section className="home-page" aria-labelledby="home-title">
        <p className="eyebrow">TalkReady practice space</p>
        <h1 id="home-title">Your next interview starts here</h1>
        <p className="welcome-copy">
          Get comfortable explaining what you know, one question at a time.
        </p>

        <div className="home-cards">
          <Link className="home-card home-card-primary" to="/notes?source=builtin">
            <span className="home-card-kicker">01 / READY TO USE</span>
            <h2>Practice with prebuilt notes</h2>
            <p>Pick a subject and start with prepared study topics.</p>
            <span className="home-card-action">Choose a topic</span>
          </Link>
          <Link className="home-card" to="/notes?source=personal">
            <span className="home-card-kicker">02 / YOUR MATERIAL</span>
            <h2>Use my notes</h2>
            <p>Practice from your own study guides and class notes.</p>
            <span className="home-card-action">Open my notes</span>
          </Link>
          <article className="home-card home-card-disabled" aria-disabled="true">
            <span className="home-card-kicker">03 / IN DEVELOPMENT</span>
            <h2>Communication drills</h2>
            <p>Short exercises for clearer, more confident speaking.</p>
            <span className="coming-soon">Coming soon</span>
          </article>
        </div>
      </section>
    </PageFrame>
  );
}
