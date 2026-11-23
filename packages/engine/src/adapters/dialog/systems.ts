import { createHarnessDialogTarget } from './harness.ts';

// One entry per measured system; how each page was built is said in the page's own source.
export const createReactAriaDialogTarget = () =>
  createHarnessDialogTarget({
    id: 'react-aria',
    system: 'React Aria',
    notes:
      'DialogTrigger with a Button and a Modal holding a Dialog, as in the first example of the Modal docs, with autoFocus on the text field as that example has it; no props on Modal or Dialog.',
  });

/** A variant of React Aria, not a system of its own: the same dialog without autoFocus (ADR 0005). */
export const createReactAriaDefaultFocusDialogTarget = () =>
  createHarnessDialogTarget({
    id: 'react-aria-default-focus',
    system: 'React Aria',
    notes:
      'A variant, not counted: the same dialog with no autoFocus on the text field, so where focus goes on opening is the component’s default. The counted page follows the docs example, which sets it.',
    page: { folder: 'react-aria', file: 'dialog-default-focus.html' },
  });

export const createChakraDialogTarget = () =>
  createHarnessDialogTarget({
    id: 'chakra',
    system: 'Chakra UI',
    notes:
      'Dialog.Root with no props, a Dialog.Trigger around a Button and the content in a Portal, as in the Basic example, with the example’s own close button; no initial focus is set.',
  });

export const createFluentDialogTarget = () =>
  createHarnessDialogTarget({
    id: 'fluent',
    system: 'Fluent 2',
    notes:
      'Dialog with DialogTrigger around a Button, DialogSurface, DialogBody, DialogTitle, DialogContent and DialogActions, as in the Default story; modalType at its default, modal. The field is a Label and an Input, as the With Form story writes them.',
  });

// MUI's buttons are named in capitals in the accessibility tree; the text in the page is not.
const muiNames = { cancelName: 'CANCEL' };

export const createMuiDialogTarget = () =>
  createHarnessDialogTarget({
    id: 'mui',
    system: 'MUI',
    notes:
      'Dialog with DialogTitle, DialogContent and DialogActions, opened by a Button, as in the Form dialogs demo, with autoFocus on the TextField as that demo has it; nothing else set on Dialog.',
    ...muiNames,
  });

/** A variant of MUI, not a system of its own: the same dialog without autoFocus (ADR 0005). */
export const createMuiDefaultFocusDialogTarget = () =>
  createHarnessDialogTarget({
    id: 'mui-default-focus',
    system: 'MUI',
    notes:
      'A variant, not counted: the same dialog with no autoFocus on the TextField, so where focus goes on opening is the component’s default. The counted page follows the docs demo, which sets it.',
    page: { folder: 'mui', file: 'dialog-default-focus.html' },
    ...muiNames,
  });

export const createPrimerDialogTarget = () =>
  createHarnessDialogTarget({
    id: 'primer',
    system: 'GitHub Primer',
    notes:
      'Dialog with title, onClose and footerButtons, rendered while a Button’s state says open, as in the Default story, with the component’s own close button; no initialFocusRef, returnFocusRef or autoFocus.',
  });

export const createAtlassianDialogTarget = () =>
  createHarnessDialogTarget({
    id: 'atlassian',
    system: 'Atlassian',
    notes:
      'Modal in a ModalTransition with ModalHeader hasCloseButton, ModalTitle, ModalBody and ModalFooter, as in the Default example; only onClose on Modal. The buttons and the field are plain HTML elements: @atlaskit/button and @atlaskit/textfield are not installed.',
  });
