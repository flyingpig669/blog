export function trapDialogFocus(event, root) {
  if (event.key !== 'Tab' || !root) return;
  const controls = [...root.querySelectorAll('button:not([disabled]),a[href],input,select,[tabindex="0"]')]
    .filter(element => element.getClientRects().length);
  const first = controls[0], last = controls.at(-1);
  if (!first) { event.preventDefault(); root.focus(); return; }
  if (document.activeElement === root ||
      (event.shiftKey && document.activeElement === first) ||
      (!event.shiftKey && document.activeElement === last)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
}
