import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  { src: "/welcome-bonus-banner.jpeg", alt: "Welcome bonus — GHC100 on your first deposit" },
  { src: "/champion-banner.jpeg", alt: "Bet like a champion — Boosted odds every day" },
  { src: "/live-now-banner.jpeg", alt: "Live now — Bet in play, cash out fast" },
  { src: "/football-every-day-banner.jpeg", alt: "Football every day — Back greatness, bet on the world's game" },
  { src: "/nexusbet-feature-banner.jpeg", alt: "NexusBet featured football, sports and gaming promotion" },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  const go = (direction) => {
    setActive((current) => (current + direction + slides.length) % slides.length);
  };

  return (
    <section className="nx-card nx-hero-carousel overflow-hidden" aria-label="Featured promotions">
      <div className="nx-hero-carousel-track">
        {slides.map((slide, index) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={slide.alt}
            className={`nx-hero-carousel-slide ${index === active ? "is-active" : ""}`}
            aria-hidden={index !== active}
            draggable="false"
          />
        ))}
        <button type="button" className="nx-hero-arrow nx-hero-arrow-left" onClick={() => go(-1)} aria-label="Previous banner">
          <ChevronLeft size={22} />
        </button>
        <button type="button" className="nx-hero-arrow nx-hero-arrow-right" onClick={() => go(1)} aria-label="Next banner">
          <ChevronRight size={22} />
        </button>
      </div>
      <div className="nx-hero-dots" role="group" aria-label="Choose promotion">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setActive(index)}
            className={`nx-hero-dot ${index === active ? "is-active" : ""}`}
            aria-label={`Show banner ${index + 1}`}
            aria-pressed={index === active}
          />
        ))}
      </div>
    </section>
  );
}
