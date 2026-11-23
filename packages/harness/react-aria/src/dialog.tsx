/*
 * React Aria modal dialog, built as the first example on https://react-aria.adobe.com/Modal
 * (read 2026-11-21, react-aria-components 1.22.1; the address /Dialog.html answers 404, and the
 * Modal page documents Dialog too). The example renders the docs' vanilla starter wrappers
 * (Modal, Dialog, Form, TextField, Button); we use the components they wrap, from the published
 * package. Props we set, and why:
 * - DialogTrigger with a Button and a Modal holding a Dialog, as in the example; no props on
 *   Modal, so isDismissable (false) and isKeyboardDismissDisabled (false) stay at their
 *   documented defaults, and Dialog's role stays 'dialog'.
 * - Heading slot="title", as in the example: it names the dialog.
 * - TextField autoFocus, as in the example ("<TextField autoFocus label="Name" …"). The owner's
 *   rule of 2026-11-21 (docs/patterns/dialog.md): where the docs' form example sets it, so does
 *   the page. The same dialog without it is measured as a variant, dialog-default-focus.html.
 * - Button slot="close" for Cancel and Save, as in the example.
 * - The title "Edit profile", one field "Name" and the buttons Cancel and Save that every
 *   dialog target gets, instead of the example's two fields, its paragraph and "Subscribe".
 * - Styles: dialog.css, the placement rules of the example's Modal.css.
 * Not followed: the Form wrapper (no rule concerns a form), and the example's second field.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Input,
  Label,
  Modal,
  TextField,
} from 'react-aria-components';
import './dialog.css';

// The variant page sets this to false; nothing else differs between the two.
const autoFocus = document.documentElement.dataset.autoFocus !== 'false';

function EditProfile() {
  return (
    <DialogTrigger>
      <Button>Edit profile</Button>
      <Modal>
        <Dialog>
          <Heading slot="title">Edit profile</Heading>
          <TextField autoFocus={autoFocus}>
            <Label>Name</Label>
            <Input />
          </TextField>
          <div>
            <Button slot="close">Cancel</Button>
            <Button slot="close">Save</Button>
          </div>
        </Dialog>
      </Modal>
    </DialogTrigger>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <EditProfile />
    </StrictMode>,
  );
}
