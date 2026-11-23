/*
 * GitHub Primer Dialog, built as the Default story: packages/react/src/Dialog/Dialog.stories.tsx
 * in primer/react, read on 2026-11-21 at the tag of the measured version, @primer/react@38.45.0.
 * Props we set, and why:
 * - A Button whose onClick toggles the state, and the Dialog rendered only while it is open,
 *   with title, onClose and footerButtons: all as in the story. The story keeps a ref on the
 *   button and passes it to nothing; it is left out. No returnFocusRef and no initialFocusRef:
 *   the story sets neither.
 * - footerButtons with buttonType 'default' for Cancel and 'primary' for Save, each closing the
 *   dialog, instead of the story's three buttons. No autoFocus on a footer button: the story
 *   sets none.
 * - The title "Edit profile" and one field "Name" (FormControl with FormControl.Label and
 *   TextInput, Primer's own field) instead of the story's paragraphs and its inner dialog,
 *   which is a dialog opened from a dialog and outside this pattern.
 * - The close button in the header is the component's own and stays (docs/patterns/dialog.md).
 * - ThemeProvider and BaseStyles with the light theme, as on our other Primer pages.
 * The feature stories show no form with initial focus on a field, so there is no variant.
 */
import '@primer/primitives/dist/css/primitives.css';
import '@primer/primitives/dist/css/functional/themes/light.css';
import { StrictMode, useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BaseStyles, Button, Dialog, FormControl, TextInput, ThemeProvider } from '@primer/react';

function EditProfile() {
  const [isOpen, setIsOpen] = useState(false);
  const onDialogClose = useCallback(() => setIsOpen(false), []);
  return (
    <>
      <Button onClick={() => setIsOpen(!isOpen)}>Edit profile</Button>
      {isOpen && (
        <Dialog
          title="Edit profile"
          onClose={onDialogClose}
          footerButtons={[
            { buttonType: 'default', content: 'Cancel', onClick: onDialogClose },
            { buttonType: 'primary', content: 'Save', onClick: onDialogClose },
          ]}
        >
          <FormControl>
            <FormControl.Label>Name</FormControl.Label>
            <TextInput />
          </FormControl>
        </Dialog>
      )}
    </>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ThemeProvider>
        <BaseStyles>
          <EditProfile />
        </BaseStyles>
      </ThemeProvider>
    </StrictMode>,
  );
}
