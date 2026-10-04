import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="page">
      <h1>Page not found</h1>
      <p>This address does not exist. <Link to="/">Go to start</Link>.</p>
    </section>
  );
}
