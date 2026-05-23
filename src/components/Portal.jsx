import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export function Portal({ children }) {
  const el = useRef(document.createElement("div"));

  useEffect(() => {
    const portal = el.current;
    portal.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1000;";
    document.body.appendChild(portal);
    return () => document.body.removeChild(portal);
  }, []);

  return createPortal(
    <div style={{ pointerEvents: "auto" }}>{children}</div>,
    el.current
  );
}
