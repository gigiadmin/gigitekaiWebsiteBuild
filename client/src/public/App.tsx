import { lazy, Suspense } from "react";
import { Route, Router, Switch, useLocation } from "wouter";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { useScrollTop } from "./components/Seo";
import Home from "./pages/Home";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Blog reader is loaded on demand (pulls in marked + DOMPurify).
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));

/**
 * Public marketing site router.
 * Only marketing routes live here. Everything else (/admin, /helpdesk, /support,
 * /kb, legacy pages) is served by the existing application bundle and is
 * never matched by this router — the server decides which entry to serve.
 *
 * A future website Q&A assistant can be mounted in <Shell/> below the <main>
 * element without touching the admin application.
 */
function Shell() {
  const [location] = useLocation();
  useScrollTop(location);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <main id="main">
        <Suspense fallback={<div className="container loading">Loading…</div>}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/services" component={Services} />
            <Route path="/services/:slug">{(params) => <ServiceDetail slug={params.slug} />}</Route>
            <Route path="/about" component={About} />
            <Route path="/contact" component={Contact} />
            <Route path="/blog" component={Blog} />
            <Route path="/blog/:slug">{(params) => <BlogPost slug={params.slug} />}</Route>
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}

export default function App({ ssrPath }: { ssrPath?: string }) {
  return (
    <Router ssrPath={ssrPath}>
      <Shell />
    </Router>
  );
}
