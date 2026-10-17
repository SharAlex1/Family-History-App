import React, { useEffect, useId, useRef } from "react";

// Native modal dialogs supply focus containment, inert background, Escape and focus restoration.
export function DialogFrame({
  children,
  title,
  onClose,
  width = 560,
  className = "fa-modal",
  element: Element = "div",
  backdropClassName = "",
}) {
  const ref = useRef(null),
    titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current,
      previous = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  const trap = (e) => {
    if (e.key !== "Tab") return;
    const controls = [
      ...ref.current.querySelectorAll(
        'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
      ),
    ].filter((el) => el.getClientRects().length);
    const first = controls[0],
      last = controls.at(-1);
    if (!first) {
      e.preventDefault();
      ref.current.focus();
      return;
    }
    if (
      e.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === ref.current)
    ) {
      e.preventDefault();
      last.focus();
    } else if (
      !e.shiftKey &&
      (document.activeElement === last ||
        document.activeElement === ref.current)
    ) {
      e.preventDefault();
      first.focus();
    }
  };
  return (
    <dialog
      onKeyDown={trap}
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        closeRef.current();
      }}
      onClick={(e) => {
        if (e.target === ref.current) closeRef.current();
      }}
      style={{
        border: 0,
        padding: 0,
        background: "transparent",
        maxWidth: "100vw",
        maxHeight: "100dvh",
        width: "100vw",
        height: "100dvh",
        margin: 0,
        color: "inherit",
      }}
    >
      <div
        className={`fa-modal-wrap ${backdropClassName}`}
        onClick={() => closeRef.current()}
      >
        <Element
          className={className}
          style={{ width }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 id={titleId} className="fa-sr-only">
            {title}
          </h2>
          {children}
        </Element>
      </div>
    </dialog>
  );
}
