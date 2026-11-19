import styles from './playground.module.css';

// Motion around the live reference, added by the playground without touching the reference's code
// (apps/atlas/CLAUDE.md, functional tier): a glow that travels to whatever has focus, and chips that leave
// instead of vanishing while the rest slide into place.

const isReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

const boxOf = (element: Element, origin: DOMRect): Box => {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left - origin.left,
    y: rect.top - origin.top,
    width: rect.width,
    height: rect.height,
  };
};

const place = (element: HTMLElement, box: Box) => {
  element.style.transform = `translate(${box.x}px, ${box.y}px)`;
  element.style.width = `${box.width}px`;
  element.style.height = `${box.height}px`;
};

/**
 * A chip is ringed as a whole. For the input, the glow settles on the field's box, which the
 * reference already rings while focus is inside: one ring, not one nested in another (design
 * review 2026-11-11).
 */
function focusTarget(root: HTMLElement): Element | undefined {
  const active = document.activeElement;
  if (!active || !root.contains(active)) return undefined;
  return active.closest('.chip') ?? active.closest('.chip-field__box') ?? active;
}

function createGlow(stage: HTMLElement, root: HTMLElement) {
  const glow = document.createElement('div');
  glow.className = styles.focusGlow ?? '';
  glow.setAttribute('aria-hidden', 'true');
  stage.append(glow);
  const update = () => {
    const target = focusTarget(root);
    glow.dataset.visible = String(target !== undefined);
    if (!target) return;
    place(glow, boxOf(target, stage.getBoundingClientRect()));
    // The reference re-renders chips with a short entry animation; measure again once it ends.
    for (const animation of target.getAnimations()) {
      animation.finished.then(update, () => undefined);
    }
  };
  return { update, remove: () => glow.remove() };
}

interface ChipSnapshot {
  box: Box;
  html: string;
}

/**
 * A chip's identity is its person, read from the remove button's name. The reference renders
 * every chip anew on each change, so elements cannot be compared; names can.
 */
const nameOf = (chip: Element) =>
  chip.querySelector('button')?.getAttribute('aria-label') ?? chip.textContent ?? '';

/** Where every chip is now, so a removal can start from where things were. */
function snapshot(root: HTMLElement, stage: HTMLElement): Map<string, ChipSnapshot> {
  const origin = stage.getBoundingClientRect();
  return new Map(
    [...root.querySelectorAll('.chip')].map((chip) => [
      nameOf(chip),
      { box: boxOf(chip, origin), html: chip.innerHTML },
    ]),
  );
}

function ghostOf({ box, html }: ChipSnapshot): HTMLElement {
  const ghost = document.createElement('div');
  ghost.className = `chip ${styles.chipGhost ?? ''}`;
  ghost.innerHTML = html;
  ghost.querySelector('button')?.remove();
  ghost.setAttribute('aria-hidden', 'true');
  ghost.inert = true;
  place(ghost, box);
  return ghost;
}

const easing = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

function leave(stage: HTMLElement, chip: ChipSnapshot) {
  const ghost = ghostOf(chip);
  stage.append(ghost);
  const from = ghost.style.transform;
  const animation = ghost.animate(
    [
      { opacity: 1, transform: from },
      { opacity: 0, transform: `${from} scale(0.86)` },
    ],
    { duration: 240, easing },
  );
  animation.onfinish = () => ghost.remove();
  animation.oncancel = () => ghost.remove();
}

/** People who left fade out where they were; the ones who stayed slide from there (FLIP). */
function animateChanges(root: HTMLElement, stage: HTMLElement, before: Map<string, ChipSnapshot>) {
  const origin = stage.getBoundingClientRect();
  const now = new Map([...root.querySelectorAll('.chip')].map((chip) => [nameOf(chip), chip]));
  for (const [name, chip] of before) {
    const current = now.get(name);
    if (!current) {
      leave(stage, chip);
      continue;
    }
    const box = boxOf(current, origin);
    const [dx, dy] = [chip.box.x - box.x, chip.box.y - box.y];
    if (dx === 0 && dy === 0) continue;
    current.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
      duration: 280,
      delay: 60,
      easing,
      fill: 'backwards',
    });
  }
}

/** Attaches both motions to a mounted reference; returns the cleanup. */
export function attachFieldMotion(root: HTMLElement): () => void {
  const stage = root.parentElement;
  const list = root.querySelector('.chip-field__chips');
  if (!stage || !list) return () => undefined;
  const glow = createGlow(stage, root);
  let before = snapshot(root, stage);
  const observer = new MutationObserver(() => {
    if (!isReduced()) animateChanges(root, stage, before);
    before = snapshot(root, stage);
    requestAnimationFrame(glow.update);
  });
  observer.observe(list, { childList: true });
  const onFocus = () => requestAnimationFrame(glow.update);
  const onResize = () => {
    before = snapshot(root, stage);
    glow.update();
  };
  root.addEventListener('focusin', onFocus);
  root.addEventListener('focusout', onFocus);
  window.addEventListener('resize', onResize);
  return () => {
    observer.disconnect();
    root.removeEventListener('focusin', onFocus);
    root.removeEventListener('focusout', onFocus);
    window.removeEventListener('resize', onResize);
    glow.remove();
  };
}
