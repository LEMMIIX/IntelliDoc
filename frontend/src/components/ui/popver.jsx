import { useState, useEffect, useRef } from "react";

export default function ParamsPopoverLayout({
  open,
  setOpen,
  children,
  top,
  left,
}) {
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open, setOpen]);

  return (
    <div
      ref={popoverRef}
      style={{
        position: "absolute",
        // top: "100%",
        // left: "-38rem",
        // top: "32%",
        // left: "51rem",
        top: top,
        left: left,
        transform: "translateX(-90%)",
        width: "35rem",

        zIndex: "999",
      }}
    >
      {open && <div style={{ width: "100%" }}>{children}</div>}
    </div>
  );
}
