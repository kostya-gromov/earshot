/*
 * MUI Dialog, built as the "Form dialogs" demo on https://mui.com/material-ui/react-dialog/: its
 * code is docs/data/material/components/dialogs/FormDialog.tsx in mui/material-ui, read on
 * 2026-11-21 at the tag of the measured version, v9.5.0. Props we set, and why:
 * - Dialog with open and onClose held in state, opened by a Button with variant "outlined" and
 *   onClick, as in the demo. Nothing else on Dialog, so Modal's disableAutoFocus,
 *   disableEnforceFocus and disableRestoreFocus stay false ("@default false" in the installed
 *   types).
 * - DialogTitle, DialogContent and DialogActions with two Buttons whose onClick closes the
 *   dialog, as the demo's Cancel does.
 * - TextField with autoFocus, margin "dense", an id, a label, fullWidth and variant "standard",
 *   as in the demo. autoFocus by the owner's rule of 2026-11-21 (docs/patterns/dialog.md): where
 *   the docs' form example sets it, so does the page. The same dialog without it is measured as
 *   a variant, dialog-default-focus.html.
 * - The title "Edit profile", one field "Name" and the buttons Cancel and Save that every
 *   dialog target gets, instead of the demo's "Subscribe", its paragraph and "Email Address".
 * Not followed: the demo's form element with its submit button, and required, name and
 * type="email" on the field: no rule concerns a form, and this field is plain text.
 */
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

// The variant page sets this to false; nothing else differs between the two.
const autoFocus = document.documentElement.dataset.autoFocus !== 'false';

function EditProfile() {
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Edit profile
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus={autoFocus}
            margin="dense"
            id="name"
            label="Name"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleClose}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
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
