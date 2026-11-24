/**
 * Holds the reference's chip box at its starting height while the person (or Watch it) removes
 * chips: a removal that unwraps a row would otherwise pull the whole page up, often long after
 * the key press (design review 2026-11-11: 36 px at 390 px). Added chips still grow it. A new
 * width measures again; Reset remounts the field and starts fresh. The reference code itself is
 * unchanged: only an inline min-height on its box, owned by Earshot.
 */
export function holdFieldHeight(root: HTMLElement): () => void {
  const box = root.querySelector<HTMLElement>('.chip-field__box');
  if (!box) return () => undefined;
  let width = root.clientWidth;
  const hold = () => {
    box.style.minHeight = '';
    box.style.minHeight = `${box.offsetHeight}px`;
  };
  hold();
  const observer = new ResizeObserver(() => {
    if (root.clientWidth === width) return;
    width = root.clientWidth;
    hold();
  });
  observer.observe(root);
  return () => {
    observer.disconnect();
    box.style.minHeight = '';
  };
}
