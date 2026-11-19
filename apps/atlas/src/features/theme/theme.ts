/** The visitor's theme choice; "system" follows prefers-color-scheme. Stored only in this browser. */
export type ThemeChoice = 'system' | 'light' | 'dark';

export const themeStorageKey = 'atlas-theme';

/**
 * Runs in <head> before the first paint, so a stored choice never flashes the other theme.
 * Kept as a string because it must run before React; storage can throw in private windows.
 */
export const themeBootScript = `try{var t=localStorage.getItem('${themeStorageKey}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

/**
 * Inlined in <head> beside the boot script. The tokens arrive in a linked stylesheet; until it
 * does, this alone makes the browser paint its own dark or light canvas, so a dark page never
 * opens on a white frame. No colour is repeated here: the token still sets the real one.
 */
export const themeBootStyle =
  'html{color-scheme:light dark}html[data-theme=light]{color-scheme:light}html[data-theme=dark]{color-scheme:dark}';

export function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'system') delete root.dataset.theme;
  else root.dataset.theme = choice;
  try {
    if (choice === 'system') localStorage.removeItem(themeStorageKey);
    else localStorage.setItem(themeStorageKey, choice);
  } catch {
    // Storage is a convenience; the choice still applies to this page view.
  }
}

export function storedTheme(): ThemeChoice {
  const theme = document.documentElement.dataset.theme;
  return theme === 'light' || theme === 'dark' ? theme : 'system';
}
