"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

export function FloatingScrollTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const update = () => setVisible(window.scrollY > 650);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  if (!visible) return null;
  return <button className="floating-scroll-top" type="button" aria-label="Volver al inicio" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowUp size={20} aria-hidden="true" /></button>;
}
