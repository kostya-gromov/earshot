/*
 * Chakra UI Dialog, built as the "Basic" example on https://chakra-ui.com/docs/components/dialog
 * (read 2026-11-21; the page's HTML holds no example code, so the example was read in the
 * repository, apps/compositions/src/examples/dialog-basic.tsx: on main, and on 2026-11-23 at the
 * tag of the installed version, @chakra-ui/react@3.38.0, where the file is the same). Props we set, and why:
 * - Dialog.Root with no props, as in the example, so the documented defaults hold: modal true,
 *   trapFocus true, closeOnEscape true, closeOnInteractOutside true, role 'dialog'.
 * - Dialog.Trigger asChild around a Button, the content in a Portal with Dialog.Backdrop and
 *   Dialog.Positioner, Dialog.Header with Dialog.Title, Dialog.Body, Dialog.Footer with
 *   Dialog.ActionTrigger asChild around Cancel and a plain Button for Save, and
 *   Dialog.CloseTrigger asChild around a CloseButton: all as in the example. The close button
 *   is the example's own and stays (docs/patterns/dialog.md, Scope).
 * - The title "Edit profile", one field "Name" (Field.Root, Field.Label, Input) and the buttons
 *   Cancel and Save that every dialog target gets, instead of the example's paragraph.
 * - No initialFocusEl and no data-autofocus: the Basic example sets neither. The docs' "Initial
 *   Focus" example shows initialFocusEl pointing at a second field; it demonstrates the prop,
 *   and this dialog has one field, so it is not followed and there is no variant.
 * - ChakraProvider with defaultSystem: Chakra components need their provider and a system.
 * - The example's variant and size on the buttons are left out: no rule concerns them.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Button,
  ChakraProvider,
  CloseButton,
  Dialog,
  Field,
  Input,
  Portal,
  defaultSystem,
} from '@chakra-ui/react';

function EditProfile() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button>Edit profile</Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Edit profile</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Field.Root>
                <Field.Label>Name</Field.Label>
                <Input />
              </Field.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button>Cancel</Button>
              </Dialog.ActionTrigger>
              <Button>Save</Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

const root = document.getElementById('component');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ChakraProvider value={defaultSystem}>
        <EditProfile />
      </ChakraProvider>
    </StrictMode>,
  );
}
