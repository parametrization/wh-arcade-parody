import type { Input } from './contracts';
import { createStorage } from './storage';

export function validateBindings(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([action, keys]) =>
          /^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(action) &&
          Array.isArray(keys) &&
          keys.length > 0 &&
          keys.length <= 8 &&
          keys.every((key) => typeof key === 'string' && key.trim().length > 0 && key.length <= 64),
      )
      .map(([action, keys]) => [action, [...new Set((keys as string[]).map((key) => key.trim()))]]),
  );
}

/** Apply on the next game bind; an empty object restores default controls. */
export function saveBindings(bindings: Record<string, string[]>): void {
  createStorage('controls').set('bindings', validateBindings(bindings));
}

export function loadBindings(): Record<string, string[]> {
  return validateBindings(createStorage('controls').get<unknown>('bindings', {}));
}

export function createInput(host: HTMLElement): Input {
  let destroyed = false;
  let bindings: Record<string, string[]> = {};
  const held = new Set<string>();
  const handlers = new Map<string, Set<() => void>>();
  const originalTabIndex = host.getAttribute('tabindex');
  if (originalTabIndex === null) host.tabIndex = 0;
  const isEditable = (target: EventTarget | null) =>
    target instanceof HTMLElement &&
    !!target.closest('input, textarea, select, [contenteditable="true"]');
  const codes = (event: KeyboardEvent) => [event.code.toLowerCase(), event.key.toLowerCase()];
  const matching = (event: KeyboardEvent) =>
    Object.entries(bindings)
      .filter(([, keys]) => keys.some((key) => codes(event).includes(key.toLowerCase())))
      .map(([action]) => action);
  const clear = () => held.clear();
  const down = (event: KeyboardEvent) => {
    if (isEditable(event.target) || event.ctrlKey || event.altKey || event.metaKey) return;
    const actions = matching(event);
    if (!actions.length) return;
    // Keep Enter/Space available for actual menu buttons.
    if (
      event.target instanceof HTMLElement &&
      event.target.closest('button,a') &&
      (event.code === 'Space' || event.code === 'Enter')
    )
      return;
    event.preventDefault();
    for (const code of codes(event)) held.add(code);
    if (!event.repeat)
      for (const action of actions) for (const handler of handlers.get(action) ?? []) handler();
  };
  const up = (event: KeyboardEvent) => {
    for (const code of codes(event)) held.delete(code);
  };
  const focus = (event: PointerEvent) => {
    if (
      event.target instanceof HTMLElement &&
      event.target.closest('button,a,input,select,textarea')
    )
      return;
    host.focus({ preventScroll: true });
  };
  const blur = (event: FocusEvent) => {
    if (!(event.relatedTarget instanceof Node) || !host.contains(event.relatedTarget)) clear();
  };
  // Pointer-operated game buttons should return control to the playfield before
  // their handlers hide an overlay or leave Space targeting the previous button.
  // Keyboard activation retains button focus for accessible menu navigation.
  const click = (event: MouseEvent) => {
    if (!(event.target instanceof HTMLElement) || isEditable(event.target)) return;
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (event.detail > 0) host.focus({ preventScroll: true });
    else
      queueMicrotask(() => {
        if (!destroyed && host.isConnected && !host.contains(document.activeElement)) {
          host.focus({ preventScroll: true });
        }
      });
  };
  host.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  host.addEventListener('pointerdown', focus);
  host.addEventListener('focusout', blur);
  host.addEventListener('click', click, true);
  window.addEventListener('blur', clear);
  document.addEventListener('visibilitychange', clear);
  return {
    bind(actions) {
      const overrides = loadBindings();
      // The settings screen calls the primary Space action "action"; games may
      // name it flap, aim or share. Explicit per-game bindings take precedence.
      const primary = Object.hasOwn(actions, 'action')
        ? 'action'
        : Object.entries(actions).find(
            ([name, keys]) =>
              name !== 'pause' && keys.some((key) => key === ' ' || key.toLowerCase() === 'space'),
          )?.[0];
      bindings = Object.fromEntries(
        Object.entries(actions).map(([name, keys]) => [
          name,
          [...(overrides[name] ?? (name === primary ? overrides.action : undefined) ?? keys)],
        ]),
      );
      clear();
    },
    on(action, handler) {
      let group = handlers.get(action);
      if (!group) {
        group = new Set();
        handlers.set(action, group);
      }
      group.add(handler);
      return () => {
        group.delete(handler);
      };
    },
    pressed(action) {
      return (bindings[action] ?? []).some((key) => held.has(key.toLowerCase()));
    },
    clear,
    destroy() {
      destroyed = true;
      clear();
      handlers.clear();
      bindings = {};
      host.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      host.removeEventListener('pointerdown', focus);
      host.removeEventListener('focusout', blur);
      host.removeEventListener('click', click, true);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', clear);
      if (originalTabIndex === null) host.removeAttribute('tabindex');
      else host.setAttribute('tabindex', originalTabIndex);
    },
  };
}
