import { findGame, games, isPlayable } from '../games/registry';
import type { Settings } from '../shared/contracts';
import { clearGameScores, createStorage } from '../shared/storage';
import { loadBindings, saveBindings } from '../shared/input';
import { cardArt } from './art';

const preferences = createStorage('settings');
const defaults: Settings = {
  muted: true,
  volume: 0.4,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  highContrast: false,
  scanlines: 0.12,
};

function loadSettings(): Settings {
  const raw = preferences.get<Partial<Settings> | null>('preferences', null);
  if (!raw || typeof raw !== 'object') return { ...defaults };
  return {
    muted: typeof raw.muted === 'boolean' ? raw.muted : defaults.muted,
    volume:
      typeof raw.volume === 'number' && Number.isFinite(raw.volume)
        ? Math.max(0, Math.min(1, raw.volume))
        : defaults.volume,
    reducedMotion:
      typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : defaults.reducedMotion,
    highContrast: typeof raw.highContrast === 'boolean' ? raw.highContrast : defaults.highContrast,
    scanlines:
      typeof raw.scanlines === 'number' && Number.isFinite(raw.scanlines)
        ? Math.max(0, Math.min(0.35, raw.scanlines))
        : defaults.scanlines,
  };
}

export function createShell(root: HTMLElement) {
  let settings = loadSettings();
  const abort = new AbortController();
  root.innerHTML = `<a class="skip-link" href="#main-content">Skip to content</a>
    <div class="identity-strip"><span class="status-dot"></span> UNOFFICIAL POLITICAL SATIRE <span class="identity-detail">Independent. Unaffiliated. In development.</span></div>
    <header class="masthead"><a class="brand" href="#/" aria-label="The People's Arcade home"><span class="brand-building" aria-hidden="true">▥</span><span>THE PEOPLE'S<span class="brand-bottom">ARCADE</span></span></a><nav aria-label="Main navigation"><a href="#/" data-nav="arcade">Arcade</a><a href="#/about" data-nav="about">About</a><a href="#/sources" data-nav="sources">Sources</a><a class="settings-link" href="#/settings" data-nav="settings">Settings <span aria-hidden="true">⚙</span></a></nav></header>
    <main id="main-content" tabindex="-1"></main>
    <footer class="site-footer"><div><a class="footer-brand" href="#/">THE PEOPLE'S ARCADE<span>POWER TO THE PLAYERS.</span></a><p>A public-interest arcade remix. Political cartoons, playable ideas,<br class="desktop-break"> and a different perspective on the same old games.</p></div><div class="footer-links"><a href="#/about">About this project</a><a href="#/sources">Sources & credits</a><a href="#/settings">Accessibility & sound</a>${import.meta.env.DEV ? '<a href="#/workbench">Developer workbench ↗</a>' : ''}</div><div class="footer-note">Not a government website. Not affiliated with or endorsed by the White House.<span>Fictional gameplay · Real public figures · Original satire</span></div></footer>`;
  const main = root.querySelector<HTMLElement>('main')!;
  function applySettings() {
    document.documentElement.classList.toggle('reduced-motion', settings.reducedMotion);
    document.documentElement.classList.toggle('high-contrast', settings.highContrast);
    document.documentElement.style.setProperty('--scanlines', String(settings.scanlines));
    root.dispatchEvent(new CustomEvent('arcade:settings', { detail: { ...settings } }));
  }
  applySettings();
  root.addEventListener(
    'click',
    (event) => {
      const target = event.target as HTMLElement;
      if (target.closest('.skip-link')) {
        event.preventDefault();
        main.focus();
      }
    },
    { signal: abort.signal },
  );

  function renderHome() {
    main.innerHTML = `<section class="arcade-stage"><div class="hero"><p class="eyebrow"><span></span> A DIFFERENT KIND OF CABINET <span></span></p><h1>THE PEOPLE'S<br><strong>ARCADE</strong><span class="hero-spark" aria-hidden="true">✦</span></h1><p class="hero-copy">Same arcade energy. A different point of view.<br>Five satirical remakes. Power to the players.</p><div class="hero-meta"><span><i></i> ${games.filter((game) => isPlayable(game.id)).length} / 5 PLAYABLE BUILDS</span><span>NO COINS REQUIRED</span></div></div><div class="collection-heading"><h2>CHOOSE YOUR NEXT ADVENTURE</h2><span>01—05 / THE FIRST COLLECTION</span></div><div class="game-grid">${games.map((game, index) => `<article class="game-card" data-testid="arcade-card" style="--card-accent:${game.accent}"><a class="card-preview" href="#/games/${game.id}" tabindex="-1" aria-hidden="true">${cardArt(game.icon)}<span class="card-number">0${index + 1}</span><span class="card-preview-label">CONCEPT ART</span></a><div class="card-copy"><p class="game-genre">${game.genre}</p><h3><a href="#/games/${game.id}">${game.title}</a></h3><p>${game.description}</p><div class="card-bottom"><span class="development-label">${isPlayable(game.id) ? 'PLAYABLE BUILD' : 'IN DEVELOPMENT'}</span><a href="#/games/${game.id}" class="card-action" aria-label="${isPlayable(game.id) ? 'Play' : 'Preview'} ${game.title}">${isPlayable(game.id) ? 'PLAY' : 'PREVIEW'} <span aria-hidden="true">↗</span></a></div></div></article>`).join('')}<article class="game-card coming-soon" data-testid="coming-soon" aria-label="A new adventure awaits. Coming later."><div class="mystery-art" aria-hidden="true"><span>?</span><i>✦</i></div><div class="card-copy"><p class="game-genre">THE NEXT CHAPTER</p><h3>A new adventure awaits</h3><p>Some stories are still waiting<br>for their first player.</p><div class="card-bottom"><span class="development-label">COMING LATER</span><span class="locked-icon" aria-hidden="true">＋</span></div></div></article></div><p class="collection-note">A remix in progress. Play the latest builds, then tell us what needs another round.</p></section>`;
  }
  function renderGame(id: string) {
    const game = findGame(id);
    if (!game) {
      renderMissing();
      return;
    }
    main.innerHTML = `<section class="page-section game-page" style="--card-accent:${game.accent}" data-testid="game-placeholder"><a href="#/" class="back-link">← BACK TO THE ARCADE</a><div class="game-page-heading"><p class="eyebrow">${game.genre}</p><h1>${game.title}</h1><p>${game.description}</p></div><div class="concept-layout"><div class="concept-stage">${cardArt(game.icon)}<span class="concept-badge">CONCEPT ART · IN DEVELOPMENT</span></div><div class="concept-description"><span class="section-kicker">THE REMIX</span><h2>A new point of view.</h2><p>${game.detail}</p><dl><dt>Inspired by</dt><dd>${game.originalTitle}</dd><dt>Status</dt><dd>Planning complete; gameplay in development</dd></dl><p class="small-note">This preview describes planned gameplay. It is not a playable game yet.</p><a href="#/" class="button-link">EXPLORE THE COLLECTION ↗</a></div></div><p class="satire-caption">Unofficial satire. Characters and encounters are fictionalized; a character's appearance is not a factual allegation.</p></section>`;
  }
  function renderAbout() {
    main.innerHTML = `<section class="page-section prose-page"><a href="#/" class="back-link">← BACK TO THE ARCADE</a><p class="eyebrow">ABOUT THE PROJECT</p><h1>Power to the players.</h1><p class="lede">The People's Arcade remixes a government arcade from a progressive, public-interest perspective.</p><p>These five planned games turn familiar arcade mechanics toward transparency, welcome, mutual aid and public services. They use humor, exaggeration and recognizable public figures to criticize political spectacle.</p><h2>Clearly a cartoon.</h2><p>This is an independent parody, not an official government service. Fictional dialogue and encounters are authored satire, not quotations or accounts of real events. Depicting a public figure does not establish involvement in a crime.</p><h2>Built in the open.</h2><p>All five games are playable, with keyboard and touch controls. The developer workbench offers live tuning and repeatable seeds. Card illustrations are original concept art.</p><p>Source research, asset provenance and implementation plans are maintained with the project. Public hosting does not automatically establish an asset's ownership; credits distinguish government material from third-party and original work.</p><a class="button-link" href="#/sources">SOURCES & CREDITS ↗</a></section>`;
  }
  function renderSources() {
    main.innerHTML = `<section class="page-section prose-page"><a href="#/" class="back-link">← BACK TO THE ARCADE</a><p class="eyebrow">RESEARCH & ATTRIBUTION</p><h1>Behind the remix.</h1><p class="lede">A documented reference. An independent implementation.</p><h2>Original arcade</h2><p>Reference pages were inspected on September 7, 2026. Their mechanics, layout and visual language inform this project.</p><ul class="source-list"><li><a href="https://www.whitehouse.gov/arcade/" target="_blank" rel="noreferrer">White House arcade collection ↗</a></li>${games.map((game) => `<li><a href="https://www.whitehouse.gov/arcade/${({ 'flappy-files': 'flappy-bill', 'against-the-wall': 'build-the-wall', 'rio-rescue': 'rio-run', 'supply-the-people': 'supply-line', 'trickle-down-tycoon': 'trump-savings-tycoon' } as Record<string, string>)[game.id]}/" target="_blank" rel="noreferrer">${game.originalTitle} ↗</a></li>`).join('')}</ul><h2>Artwork in this build</h2><p>The game sprites, five card illustrations, masthead and decorative graphics are original code-created artwork for this parody project. Browse <a href="https://github.com/parametrization/wh-arcade-parody/tree/main/assets/concepts">three concept-art options for each new asset family</a>. No government game sprites, tracking scripts, newsletter forms or remote assets are loaded by this shell.</p><h2>Reuse and provenance</h2><p>Each asset is reviewed and recorded individually before redistribution. The <a href="https://www.whitehouse.gov/copyright/" target="_blank" rel="noreferrer">White House copyright policy ↗</a> distinguishes government work from third-party material; exceptions and notices matter. This project does not claim blanket ownership of material on a public website.</p><p class="small-note">The full plans, reference inventory and asset records live in the repository's .internal_docs and assets directories.</p></section>`;
  }
  function renderSettings() {
    main.innerHTML = `<section class="page-section prose-page"><a href="#/" class="back-link">← BACK TO THE ARCADE</a><p class="eyebrow">MAKE YOURSELF AT HOME</p><h1>Your arcade, your settings.</h1><p class="lede">Preferences stay in this browser. No account needed.</p><form class="settings-form"><label class="setting-row"><span><strong>Sound</strong><small>Off by default. Audio begins after you interact.</small></span><input id="sound-setting" type="checkbox" ${!settings.muted ? 'checked' : ''}></label><label class="setting-row"><span><strong>Volume</strong><small>Game effects and music</small></span><input id="volume-setting" aria-label="Volume" type="range" min="0" max="1" step="0.05" value="${settings.volume}"></label><label class="setting-row"><span><strong>Reduced motion</strong><small>Quiet decorative movement and effects</small></span><input id="motion-setting" type="checkbox" ${settings.reducedMotion ? 'checked' : ''}></label><label class="setting-row"><span><strong>High contrast</strong><small>Brighter borders and supporting text</small></span><input id="contrast-setting" type="checkbox" ${settings.highContrast ? 'checked' : ''}></label><label class="setting-row"><span><strong>Scanlines</strong><small>Adjust the retro screen texture</small></span><input id="scanlines-setting" aria-label="Scanlines" type="range" min="0" max="0.35" step="0.01" value="${settings.scanlines}"></label><button class="button-link secondary-button" type="button" id="reset-settings">RESET PREFERENCES</button><p class="settings-status" role="status" aria-live="polite"></p></form><p class="small-note">Menus support keyboard navigation. Each game includes Controls & instructions and Play options for its assist modes.</p></section>`;
    const update = () => {
      settings = {
        muted: !main.querySelector<HTMLInputElement>('#sound-setting')!.checked,
        volume: Number(main.querySelector<HTMLInputElement>('#volume-setting')!.value),
        reducedMotion: main.querySelector<HTMLInputElement>('#motion-setting')!.checked,
        highContrast: main.querySelector<HTMLInputElement>('#contrast-setting')!.checked,
        scanlines: Number(main.querySelector<HTMLInputElement>('#scanlines-setting')!.value),
      };
      preferences.set('preferences', settings);
      applySettings();
      main.querySelector('.settings-status')!.textContent = 'Preferences saved.';
    };
    main.querySelector('form')!.addEventListener('input', update);
    main.querySelector('form')!.addEventListener('submit', (event) => event.preventDefault());
    main.querySelector('#reset-settings')!.addEventListener('click', () => {
      settings = { ...defaults };
      preferences.remove('preferences');
      applySettings();
      renderSettings();
      main.querySelector('.settings-status')!.textContent = 'Preferences reset.';
    });
    const controls = document.createElement('section');
    controls.className = 'control-settings';
    controls.innerHTML = `<h2>Keyboard controls</h2><p>Optional overrides apply to matching actions when a module next opens. Leave a field empty to use that module's defaults. Select a field and press a key; Tab moves to the next control.</p><div class="binding-fields">${['left', 'right', 'action', 'pause'].map((action) => `<label class="setting-row"><span><strong>${action[0].toUpperCase() + action.slice(1)}</strong></span><input type="text" readonly data-binding="${action}" aria-label="${action} key binding" placeholder="Module default"><button type="button" class="binding-clear" data-clear="${action}" aria-label="Clear ${action} override">Clear</button></label>`).join('')}</div><div class="settings-actions"><button type="button" class="button-link" id="save-controls">SAVE CONTROLS</button><button type="button" class="button-link secondary-button" id="reset-controls">RESET CONTROLS</button></div><p class="controls-status" role="status" aria-live="polite"></p><h2>Start fresh</h2><p>Reset local game progress, including saved runs and scores for all five games. Your global preferences and keyboard controls are preserved.</p><button type="button" class="button-link secondary-button" id="reset-progress">RESET GAME PROGRESS</button><p class="progress-status" role="status" aria-live="polite"></p>`;
    main.querySelector('.prose-page')!.append(controls);
    const bindings = loadBindings();
    controls.querySelectorAll<HTMLInputElement>('[data-binding]').forEach((input) => {
      input.value = bindings[input.dataset.binding!]?.[0] ?? '';
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Tab' || event.ctrlKey || event.metaKey || event.altKey) return;
        event.preventDefault();
        input.value = event.code || event.key;
        controls.querySelector('.controls-status')!.textContent =
          'Press Save controls to apply your changes.';
      });
    });
    controls.querySelectorAll<HTMLButtonElement>('[data-clear]').forEach((button) =>
      button.addEventListener('click', () => {
        controls.querySelector<HTMLInputElement>(
          `[data-binding="${button.dataset.clear}"]`,
        )!.value = '';
        controls.querySelector('.controls-status')!.textContent =
          'Press Save controls to restore the module default for this action.';
      }),
    );
    controls.querySelector('#save-controls')!.addEventListener('click', () => {
      const next = { ...loadBindings() };
      controls.querySelectorAll<HTMLInputElement>('[data-binding]').forEach((input) => {
        if (input.value) next[input.dataset.binding!] = [input.value];
        else delete next[input.dataset.binding!];
      });
      const values = Object.entries(next).flatMap(([action, keys]) =>
        keys.map((key) => ({ action, key: key.toLowerCase() })),
      );
      const duplicate = values.find((item, index) =>
        values.some(
          (other, otherIndex) =>
            otherIndex !== index && other.action !== item.action && other.key === item.key,
        ),
      );
      if (duplicate) {
        controls.querySelector('.controls-status')!.textContent =
          'Choose different keys for each action before saving.';
        return;
      }
      saveBindings(next);
      controls.querySelector('.controls-status')!.textContent =
        'Controls saved. Reopen a module to use the new bindings.';
    });
    controls.querySelector('#reset-controls')!.addEventListener('click', () => {
      saveBindings({});
      controls.querySelectorAll<HTMLInputElement>('[data-binding]').forEach((input) => {
        input.value = '';
      });
      controls.querySelector('.controls-status')!.textContent =
        'Controls reset to each module’s defaults.';
    });
    controls.querySelector('#reset-progress')!.addEventListener('click', () => {
      if (
        !window.confirm(
          'Reset all local game progress, including saved runs and scores? Preferences and controls will stay.',
        )
      )
        return;
      clearGameScores(games.map((game) => game.id));
      controls.querySelector('.progress-status')!.textContent =
        'Local game progress reset. Preferences and controls preserved.';
    });
  }
  function renderMissing() {
    main.innerHTML =
      '<section class="page-section prose-page"><p class="eyebrow">WRONG WARP PIPE</p><h1>Page not found.</h1><p>There is no adventure at this address.</p><a class="button-link" href="#/">BACK TO THE ARCADE ↗</a></section>';
  }
  return {
    main,
    settings: () => ({ ...settings }),
    render(path: string) {
      root.querySelectorAll('[data-nav]').forEach((link) => {
        const active = link.getAttribute('data-nav') === (path.split('/')[1] || 'arcade');
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      if (path === '/' || path === '') renderHome();
      else if (path.startsWith('/games/')) renderGame(path.slice('/games/'.length));
      else if (path === '/about') renderAbout();
      else if (path === '/sources') renderSources();
      else if (path === '/settings') renderSettings();
      else renderMissing();
      document.title = `${main.querySelector('h1')?.textContent?.replace(/\s+/g, ' ').trim() ?? "The People's Arcade"} · Unofficial satire`;
    },
    destroy() {
      abort.abort();
      root.replaceChildren();
    },
  };
}
