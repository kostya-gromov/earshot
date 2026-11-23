/*
 * Atlassian Modal dialog, built as the "Default" example on
 * https://atlassian.design/components/modal-dialog/examples ("The default form of a modal
 * dialog.", read 2026-11-22), with @atlaskit/modal-dialog 17.3.0 from npm. Imports by component
 * path, as the example does. Props we set, and why:
 * - ModalTransition around the Modal, rendered only while the state says open; Modal with
 *   onClose and nothing else; ModalHeader hasCloseButton with ModalTitle; ModalBody; ModalFooter
 *   with two buttons whose onClick closes the modal: all as in the example. No autoFocus on
 *   Modal: neither the Default nor the Form example passes it, so focus on opening is the
 *   component's default ("focus is moved to the first interactive element inside the modal
 *   dialog", in the installed types). shouldCloseOnOverlayClick, shouldCloseOnEscapePress and
 *   shouldReturnFocus are not set.
 * - aria-haspopup="dialog" on the button that opens it, as in the example.
 * - The title "Edit profile", one field "Name" and the buttons Cancel and Save that every
 *   dialog target gets, instead of the example's text and "Duplicate".
 * Not as in the example: the buttons and the field are plain HTML elements. The example renders
 * @atlaskit/button, and the Form example @atlaskit/form and @atlaskit/textfield; those packages
 * are not installed (only @atlaskit/modal-dialog was approved for this pattern, 2026-11-21). The
 * rules judge the modal: where focus goes, what Tab and Escape do, its role, name and modal
 * state. The close button in the header is the component's own.
 */
import { StrictMode, useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import ModalBody from '@atlaskit/modal-dialog/modal-body';
import Modal from '@atlaskit/modal-dialog/modal-dialog';
import ModalFooter from '@atlaskit/modal-dialog/modal-footer';
import ModalHeader from '@atlaskit/modal-dialog/modal-header';
import ModalTitle from '@atlaskit/modal-dialog/modal-title';
import ModalTransition from '@atlaskit/modal-dialog/modal-transition';

function EditProfile() {
  const [isOpen, setIsOpen] = useState(false);
  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  return (
    <>
      <button type="button" aria-haspopup="dialog" onClick={openModal}>
        Edit profile
      </button>
      <ModalTransition>
        {isOpen && (
          <Modal onClose={closeModal}>
            <ModalHeader hasCloseButton>
              <ModalTitle>Edit profile</ModalTitle>
            </ModalHeader>
            <ModalBody>
              <label htmlFor="name-input">Name</label>
              <input id="name-input" type="text" />
            </ModalBody>
            <ModalFooter>
              <button type="button" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" onClick={closeModal}>
                Save
              </button>
            </ModalFooter>
          </Modal>
        )}
      </ModalTransition>
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
