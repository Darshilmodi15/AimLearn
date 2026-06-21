import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="not-found-page">
      <span>404</span>
      <h1>This page wandered off course.</h1>
      <p>The learning path you’re looking for may have moved or no longer exists.</p>
      <Link className="button button-primary" to="/">
        <ArrowLeft size={17} /> Back to home
      </Link>
    </section>
  );
}
