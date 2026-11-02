import { Link } from "wouter";
import { usePageMeta } from "../components/Seo";

export default function NotFound() {
  usePageMeta({ title: "Page not found | GigitekAI", description: "The page you’re looking for doesn’t exist.", path: "/404", noindex: true });
  return (
    <section className="section section--hero">
      <div className="container">
        <div className="stack stack-24 measure">
          <p className="eyebrow">404</p>
          <h1 className="display">That page isn’t here.</h1>
          <p className="lead">It may have moved as part of our site update. The links below will get you where you need to go.</p>
          <div className="cta-row" style={{ marginTop: 8 }}>
            <Link href="/" className="btn">
              Go to the homepage
            </Link>
            <Link href="/services" className="link-arrow">
              See our services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
