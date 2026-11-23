/*
 * Fluent 2 Dialog, built as the Default story: stories/src/Dialog/DialogDefault.stories.tsx in
 * microsoft/fluentui, read on 2026-11-21 at the commit of the measured version (485355d,
 * @fluentui/react-components 9.75.2). Props we set, and why:
 * - Dialog with no props, as in the story: modalType stays at its default, 'modal' ("@default
 *   modal" in the installed types of @fluentui/react-dialog).
 * - DialogTrigger disableButtonEnhancement around a Button; DialogSurface, DialogBody,
 *   DialogTitle, DialogContent and DialogActions; in the actions the primary Button first and
 *   then a DialogTrigger disableButtonEnhancement around the secondary one: all as in the story,
 *   so Save comes before Cancel here.
 * - The title "Edit profile", one field "Name" and the buttons Save and Cancel that every
 *   dialog target gets, instead of the story's paragraph, "Do Something" and "Close". The field
 *   is a Label with htmlFor and an Input with an id, as the With Form story writes its fields.
 * - No autoFocus and no tabIndex: neither story sets any.
 * - FluentProvider with webLightTheme: Fluent components need their provider and a theme.
 * Not followed: the With Form story as a whole. It sets modalType="non-modal", which is outside
 * this pattern, and aria-describedby={undefined} on the surface; its form element is not used.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  FluentProvider,
  Input,
  Label,
  webLightTheme,
} from '@fluentui/react-components';

function EditProfile() {
  return (
    <Dialog>
      <DialogTrigger disableButtonEnhancement>
        <Button>Edit profile</Button>
      </DialogTrigger>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogContent>
            <Label htmlFor="name-input">Name</Label>
            <Input id="name-input" />
          </DialogContent>
          <DialogActions>
            <Button appearance="primary">Save</Button>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <FluentProvider theme={webLightTheme}>
        <EditProfile />
      </FluentProvider>
    </StrictMode>,
  );
}
