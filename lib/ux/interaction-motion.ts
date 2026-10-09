/** Decorative feedback only: never intercept navigation, taps or scrolling. */
export function motionAllowed(win: Window & typeof globalThis, doc: Document): boolean {
  return !win.matchMedia("(prefers-reduced-motion: reduce)").matches && doc.documentElement.dataset.performanceProfile !== "lean";
}

export function revealIfNeeded(element: HTMLElement, win: Window & typeof globalThis = window): void {
  const rect = element.getBoundingClientRect();
  // Leave visible results in place. Reserve room for the fixed header and bottom bar.
  if (rect.top >= 100 && rect.top < win.innerHeight - 140) return;
  if (win.innerHeight < 320) return; // A virtual keyboard must not cause a page jump.
  win.scrollTo({ top: Math.max(0, win.scrollY + rect.top - 100), behavior: motionAllowed(win, element.ownerDocument) ? "smooth" : "auto" });
}

export function revealSelectedPill(control: HTMLElement, win: Window & typeof globalThis): void {
  const rail = control.closest<HTMLElement>(".catalog-quick-filters, .catalog-quick-brands, .brand-filters");
  if (!rail || rail.scrollWidth <= rail.clientWidth) return;
  const button = control.getBoundingClientRect(), bounds = rail.getBoundingClientRect();
  const delta = button.left < bounds.left + 8 ? button.left - bounds.left - 8 : button.right > bounds.right - 8 ? button.right - bounds.right + 8 : 0;
  if (delta) rail.scrollTo({ left: rail.scrollLeft + delta, behavior: motionAllowed(win, rail.ownerDocument) ? "smooth" : "auto" });
}

export function installInteractionMotion(doc: Document, win: Window & typeof globalThis): () => void {
  const selector = 'button, a[href], [role="button"]';
  const pulses = new Map<HTMLElement, number>();
  let start: { id: number; x: number; y: number; control: HTMLElement } | null = null;
  function controlFor(target: EventTarget | null) {
    const control = target instanceof win.Element ? target.closest<HTMLElement>(selector) : null;
    if (!control || control.matches('[disabled], [aria-disabled="true"]') || control.closest('[data-motion="off"]')) return null;
    // Authentication and external handoffs stay entirely browser-owned.
    if (control instanceof win.HTMLAnchorElement) {
      const url = new URL(control.href, win.location.href);
      if (url.origin !== win.location.origin || /^\/(?:callback|signin-with-chatgpt|signout-with-chatgpt)(?:\/|$)/.test(url.pathname)) return null;
    }
    return control;
  }
  function pulse(x: number, y: number) {
    if (!motionAllowed(win, doc) || doc.hidden || pulses.size >= 4) return;
    const ring = doc.createElement("span");
    ring.className = "amarango-touch-wave";
    ring.setAttribute("aria-hidden", "true");
    ring.style.left = `${x}px`; ring.style.top = `${y}px`;
    doc.body.appendChild(ring);
    pulses.set(ring, win.setTimeout(() => { ring.remove(); pulses.delete(ring); }, 420));
  }
  const down = (event: PointerEvent) => {
    const control = controlFor(event.target);
    start = event.isPrimary && event.button === 0 && control ? { id: event.pointerId, x: event.clientX, y: event.clientY, control } : null;
  };
  const up = (event: PointerEvent) => {
    const saved = start; start = null;
    if (saved && saved.id === event.pointerId && saved.control === controlFor(event.target) && Math.hypot(event.clientX - saved.x, event.clientY - saved.y) <= 9) pulse(event.clientX, event.clientY);
  };
  const reset = () => { start = null; };
  const move = (event: PointerEvent) => {
    if (start && start.id === event.pointerId && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 9) reset();
  };
  const focus = (event: FocusEvent) => {
    const control = controlFor(event.target);
    if(control) revealSelectedPill(control, win);
  };
  const click = (event: MouseEvent) => {
    const control = controlFor(event.target);
    if (!control) return;
    revealSelectedPill(control, win);
    if (event.detail === 0) { const rect = control.getBoundingClientRect(); pulse(rect.left + rect.width / 2, rect.top + rect.height / 2); }
  };
  doc.addEventListener("pointerdown", down, { passive: true });
  doc.addEventListener("pointerup", up, { passive: true });
  doc.addEventListener("pointermove", move, { passive: true });
  doc.addEventListener("pointercancel", reset, { passive: true });
  doc.addEventListener("click", click, { passive: true });
  doc.addEventListener("focusin", focus, { passive: true });
  doc.addEventListener("visibilitychange", reset);
  return () => {
    doc.removeEventListener("pointerdown", down); doc.removeEventListener("pointerup", up);
    doc.removeEventListener("pointercancel", reset); doc.removeEventListener("click", click);
    doc.removeEventListener("pointermove", move); doc.removeEventListener("focusin", focus);
    doc.removeEventListener("visibilitychange", reset);
    for (const [ring, timer] of pulses) { win.clearTimeout(timer); ring.remove(); }
    pulses.clear(); reset();
  };
}
