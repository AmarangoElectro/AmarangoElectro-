"use client";

import Link from "./store-link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { playSonicCue } from "@/lib/ux/sonic-feedback";

const slides = [
  { slug: "smart-tv", label: "Smart TV", href: "/categoria/smart-tv#catalogo", desktop: "/assets/v16-final/main/smart-tv.png", mobile: "/assets/v16-final/main/smart-tv.png", background: "#06152d" },
  { slug: "electrodomesticos", label: "Electrodomésticos", href: "/categoria/electrodomesticos#catalogo", desktop: "/assets/v16-final/main/electrodomesticos.png", mobile: "/assets/v16-final/main/electrodomesticos.png", background: "#21150f" },
  { slug: "climatizacion", label: "Climatización", href: "/categoria/electrodomesticos?sector=climatizacion#catalogo", desktop: "/assets/v16-final/main/climatizacion.png", mobile: "/assets/v16-final/main/climatizacion.png", background: "#071830" },
  { slug: "audio", label: "Audio", href: "/categoria/audio#catalogo", desktop: "/assets/v16-final/main/audio.png", mobile: "/assets/v16-final/main/audio.png", background: "#050a14" },
  { slug: "hogar", label: "Hogar y estilo", href: "/categoria/hogar#catalogo", desktop: "/assets/v16-final/main/hogar.png", mobile: "/assets/v16-final/main/hogar.png", background: "#2b1d18" },
  { slug: "descanso", label: "Descanso", href: "/categoria/descanso#catalogo", desktop: "/assets/v16-final/main/descanso.png", mobile: "/assets/v16-final/main/descanso.png", background: "#302018" },
] as const;

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inViewport, setInViewport] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [constrainedRuntime, setConstrainedRuntime] = useState(false);
  // The first artwork is part of the server render. Keeping it out until an
  // effect ran was the source of the multi-second blurred/empty first frame.
  const [loadedImages, setLoadedImages] = useState<ReadonlySet<number>>(() => new Set([0]));
  const touchStart = useRef<number | null>(null);
  const sliderRef = useRef<HTMLElement | null>(null);
  const show = useCallback((index: number) => {
    if (sliderRef.current) {
      sliderRef.current.scrollTop = 0;
      sliderRef.current.scrollLeft = 0;
    }
    const normalized = (index + slides.length) % slides.length;
    const next = (normalized + 1) % slides.length;
    setLoadedImages((previous) => {
      const updated = new Set(previous);
      updated.add(normalized);
      if (!constrainedRuntime) updated.add(next);
      return updated;
    });
    setCurrent(normalized);
  }, [constrainedRuntime]);


  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const runtime = navigator as Navigator & { connection?: EventTarget & { saveData?: boolean; effectiveType?: string }; cpuPerformance?: number };
    const connection = runtime.connection;

    const syncMotion = () => setReducedMotion(media.matches);
    const syncRuntime = () => {
      const lowCpuTier = typeof runtime.cpuPerformance === "number" && runtime.cpuPerformance > 0 && runtime.cpuPerformance <= 2;
      setConstrainedRuntime(Boolean(connection?.saveData || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g" || lowCpuTier));
    };
    const syncVisibility = () => setPageVisible(document.visibilityState === "visible");

    syncMotion();
    syncRuntime();
    syncVisibility();
    media.addEventListener?.("change", syncMotion);
    connection?.addEventListener?.("change", syncRuntime);
    document.addEventListener("visibilitychange", syncVisibility);

    const observer = sliderRef.current && "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => setInViewport(Boolean(entry?.isIntersecting)), { rootMargin: "160px 0px" })
      : null;
    if (observer && sliderRef.current) observer.observe(sliderRef.current);

    return () => {
      media.removeEventListener?.("change", syncMotion);
      connection?.removeEventListener?.("change", syncRuntime);
      document.removeEventListener("visibilitychange", syncVisibility);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (constrainedRuntime) return;
    const frame = window.requestAnimationFrame(() => {
      setLoadedImages((previous) => new Set(previous).add(1));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [constrainedRuntime]);

  useEffect(() => {
    if (paused || !inViewport || !pageVisible || reducedMotion || constrainedRuntime) return;
    const timer = window.setInterval(() => show(current + 1), 6500);
    return () => window.clearInterval(timer);
  }, [constrainedRuntime, current, inViewport, pageVisible, paused, reducedMotion, show]);

  function showManually(index: number) {
    playSonicCue("slide");
    show(index);
  }

  return (
    <section
      ref={sliderRef}
      className="hero-slider image-active hero-slider-v16-premium"
      aria-label="Universos AmarangoElectro"
      onFocusCapture={() => {
        if (sliderRef.current) sliderRef.current.scrollTop = 0;
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current;
        if (Math.abs(delta) > 45) showManually(current + (delta < 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      {slides.map((slide, index) => (
        <article
          key={slide.label}
          className={`hero-slide image-slide ${index === current ? "active" : ""}`}
          aria-hidden={index !== current}
          data-slide-slug={slide.slug}
          data-artwork-framing="premium-advertising"
          style={({
            "--slide-desktop": `url(${slide.desktop})`,
            "--slide-mobile": `url(${slide.mobile})`,
            "--slide-background": slide.background,
          } as CSSProperties)}
        >
          {loadedImages.has(index) ? (
            <Link href={slide.href} className="hero-slide-link" tabIndex={index === current ? 0 : -1} aria-label={`Ir a ${slide.label}`}>
              <picture>
                <source media="(max-width: 620px)" srcSet={slide.mobile} />
                <img
                  src={slide.desktop}
                  alt={`${slide.label} — AmarangoElectro`}
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding={index === 0 ? "sync" : "async"}
                />
              </picture>
              <span className="hero-slide-action" aria-hidden="true">Ver sector <b>→</b></span>
            </Link>
          ) : null}
        </article>
      ))}
      <button className="hero-arrow previous" type="button" aria-label="Banner anterior" onClick={() => showManually(current - 1)}><ChevronLeft /></button>
      <button className="hero-arrow next" type="button" aria-label="Banner siguiente" onClick={() => showManually(current + 1)}><ChevronRight /></button>
      <div className="hero-dots" aria-label="Elegir banner">
        {slides.map((slide, index) => (
          <button key={slide.label} className={index === current ? "active" : ""} type="button" aria-label={slide.label} aria-current={index === current ? "true" : undefined} onClick={() => showManually(index)} />
        ))}
      </div>
    </section>
  );
}
