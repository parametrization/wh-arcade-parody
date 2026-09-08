import { createShell } from './site/shell';
import { isPlayable, loadGame } from './games/registry';
import { mountGame } from './site/game-host';
import './site/styles.css';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Missing arcade application root.');
const shell = createShell(root);
const hotReloaded = Boolean(import.meta.hot?.data.reloaded);
let disposeRoute: (() => void) | undefined;
let generation = 0;
let disposed = false;
let routeAbort = new AbortController();

async function renderRoute() {
  const ticket = ++generation;
  routeAbort.abort();
  routeAbort = new AbortController();
  const routeSignal = routeAbort.signal;
  disposeRoute?.();
  disposeRoute = undefined;
  const route = location.hash.slice(1) || location.pathname || '/';
  const [rawPath, query = ''] = route.split('?');
  const path = rawPath.replace(/\/+$/, '') || '/';
  if (import.meta.env.DEV && path === '/workbench') {
    shell.main.innerHTML =
      '<section class="page-section"><p role="status">Loading developer workbench…</p></section>';
    document.title = "Developer workbench · The People's Arcade";
    try {
      const { mountWorkbench } = await import('./dev/workbench');
      if (disposed || ticket !== generation) return;
      const cleanup = await mountWorkbench(
        shell.main,
        shell.settings(),
        new URLSearchParams(query).get('game') ?? 'diagnostic',
        routeSignal,
      );
      if (disposed || ticket !== generation) cleanup();
      else disposeRoute = cleanup;
    } catch (error) {
      if (ticket !== generation) return;
      shell.main.innerHTML =
        '<section class="page-section"><h1>Workbench unavailable.</h1><p role="alert"></p><a class="button-link" href="#/">BACK TO THE ARCADE</a></section>';
      shell.main.querySelector('[role="alert"]')!.textContent =
        error instanceof Error ? error.message : 'Try reloading the page.';
    }
  } else if (path.startsWith('/games/') && isPlayable(path.slice(7))) {
    shell.main.innerHTML =
      '<section class="page-section"><p role="status">Loading game…</p></section>';
    try {
      const module = await loadGame(path.slice(7));
      if (disposed || ticket !== generation) return;
      const cleanup = await mountGame(shell.main, module, shell.settings(), routeSignal);
      if (disposed || ticket !== generation) cleanup();
      else disposeRoute = cleanup;
    } catch (error) {
      if (disposed || ticket !== generation) return;
      shell.main.innerHTML =
        '<section class="page-section"><h1>Game could not load.</h1><p role="alert"></p><button class="button-link" id="retry-game">RETRY</button></section>';
      shell.main.querySelector('[role="alert"]')!.textContent =
        error instanceof Error ? error.message : 'Please try again.';
      shell.main.querySelector('#retry-game')!.addEventListener(
        'click',
        () => {
          void renderRoute();
        },
        { once: true },
      );
    }
  } else shell.render(path);
  if (ticket === generation && hotReloaded) {
    const notice = shell.main.querySelector('.workbench-notice,.game-host-status');
    if (notice) notice.textContent = 'Hot reload: module remounted; previous run disposed.';
  }
  if (ticket === generation) {
    window.scrollTo(0, 0);
    (shell.main.querySelector<HTMLElement>('.diagnostic-host') ?? shell.main).focus({
      preventScroll: true,
    });
  }
}

window.addEventListener('hashchange', renderRoute);
void renderRoute();
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    import.meta.hot!.data.reloaded = true;
    disposed = true;
    generation++;
    routeAbort.abort();
    window.removeEventListener('hashchange', renderRoute);
    disposeRoute?.();
    shell.destroy();
  });
}
