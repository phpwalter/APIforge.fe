import { Layers, Terminal, Sparkles } from 'lucide-react';
import { useAppStore } from '../../state/useAppStore';
import { AuthModal } from '../Auth/AuthModal';
import { DocDialog } from '../DocDialog/DocDialog';
import { APP_VERSION } from '../../lib/appInfo';
import { LEGAL_DOCS } from '../../lib/legalDocs';
import styles from './LandingPage.module.css';

const FOOTER_LINKS = ['Terms', 'Privacy', 'Security', 'Status', 'Community', 'Docs', 'Contact', 'Cookies'];

export function LandingPage() {
  const theme = useAppStore((s) => s.theme);
  const openAuth = useAppStore((s) => s.openAuth);
  const authOpen = useAppStore((s) => s.authOpen);
  const docDialogOpen = useAppStore((s) => s.docDialogOpen);
  const openDocDialog = useAppStore((s) => s.openDocDialog);

  const linkClick = (label: string) => {
    const doc = LEGAL_DOCS[label];
    if (doc) openDocDialog(doc.title, doc.src);
  };

  return (
    <div className="app" data-theme={theme} style={{ position: 'absolute', inset: 0 }}>
      <div className={styles.page}>
        <div className={styles.topBar} />

        <header className={styles.header}>
          <span className={styles.brandIcon}>
            <Layers size={19} />
          </span>
          <span className={styles.brandName}>APIforge</span>
          <span className={styles.pill}>{APP_VERSION}</span>
          <div className={styles.headerSpacer} />
          <button type="button" className={styles.signInBtn} onClick={openAuth}>
            Sign In
          </button>
        </header>

        <div className={styles.hero}>
          <div className={styles.heroIcon}>
            <Terminal size={28} />
          </div>
          <h1 className={styles.heroTitle}>APIforge 2.0 Compiler</h1>
          <p className={styles.heroSubtitle}>
            Design REST APIs visually — pick HTTP methods, define paths and parameters, and
            model reusable schemas. The compiler turns your design into a clean, ready-to-export
            OpenAPI 3.1 document, with a live preview and diagnostics as you go.
          </p>

          <div className={styles.cards}>
            <div className={styles.card}>
              <p className={styles.cardTitle}>
                <span className={styles.cardIcon}>
                  <Layers size={14} />
                </span>
                1. Visual Endpoint Editor
              </p>
              <p className={styles.cardDesc}>
                Pick a method, define the path, and configure parameters, headers, and responses
                — no YAML required.
              </p>
            </div>
            <div className={styles.card}>
              <p className={styles.cardTitle}>
                <span className={styles.cardIcon}>
                  <Sparkles size={14} />
                </span>
                2. Compiled REST
              </p>
              <p className={styles.cardDesc}>
                Watch your design compile into a live, ready-to-export OpenAPI document.
              </p>
            </div>
          </div>

          <p className={styles.gateNote}>Please sign in to access your projects</p>
        </div>

        <footer className={styles.footer}>
          <div className={styles.footerLeft}>
            <span className={styles.footerBrandIcon}>
              <Layers size={14} />
            </span>
            <span>© 2026 APIforge, Inc.</span>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerLinksRow}>
              {FOOTER_LINKS.map((label) => (
                <button key={label} type="button" className={styles.footerLink} onClick={() => linkClick(label)}>
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.footerLink}
              onClick={() => linkClick('Do not share my personal information')}
            >
              Do not share my personal information
            </button>
          </div>
        </footer>
      </div>
      {authOpen && <AuthModal />}
      {docDialogOpen && <DocDialog />}
    </div>
  );
}
