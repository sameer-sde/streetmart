import { useState, useEffect, createContext, useContext, useCallback } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((msg, type = "default", duration = 2500) => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration);
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", zIndex:999, display:"flex", flexDirection:"column", gap:8, alignItems:"center" }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
