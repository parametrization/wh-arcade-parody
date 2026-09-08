import { createShell } from './site/shell';
import './site/styles.css';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing arcade application root.');
const shell = createShell(root);
let disposeRoute: (() => void) | undefined;
let generation = 0;
let disposed = false;

async function renderRoute() {
  const ticket = ++generation;
  disposeRoute?.(); disposeRoute = undefined;
  const path = location.hash.slice(1) || location.pathname.replace(/\/+$/, '') || '/';
  if (import.meta.env.DEV && path === '/workbench') {
    shell.main.innerHTML = '<section class="page-section"><p role="status">Loading developer workbench…</p></section>';
    document.title = "Developer workbench · The People's Arcade";
    try {
      const { mountWorkbench } = await import('./dev/workbench');
      if (disposed || ticket !== generation) return;
      const cleanup = await mountWorkbench(shell.main, shell.settings());
      if (disposed || ticket !== generation) cleanup(); else disposeRoute = cleanup;
    } catch (error) {
      if (ticket !== generation) return;
      shell.main.innerHTML = '<section class="page-section"><h1>Workbench unavailable.</h1><p role="alert"></p><a class="button-link" href="#/">BACK TO THE ARCADE</a></section>';
      shell.main.querySelector('[role="alert"]')!.textContent = error instanceof Error ? error.message : 'Try reloading the page.';
    }
  } else shell.render(path);
  if (ticket === generation) { window.scrollTo(0, 0); shell.main.focus({ preventScroll: true }); }
}

window.addEventListener('hashchange', renderRoute);
void renderRoute();
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => { disposed = true; generation++; window.removeEventListener('hashchange', renderRoute); disposeRoute?.(); shell.destroy(); });
}
