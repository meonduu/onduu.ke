import { Link } from "./nav-link";
import { Footer, Header } from "./components";
export default function NotFound(){return <><Header/><main id="main" className="not-found"><p className="eyebrow">404 / ROUTE NOT FOUND</p><h1>This page is not part of the current system.</h1><p className="lede">The link may be old, gated or waiting for approval. Start with the Readiness Score or return home.</p><div className="actions"><Link className="button" href="/readiness">Check Your Digital Readiness ↗</Link><Link className="text-link" href="/">Return home</Link></div></main><Footer/></>}
