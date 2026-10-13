"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlide } from "@/lib/types";

const AUTOPLAY_MS = 5000;

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = slides.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (count <= 1 || paused || reducedMotion) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, paused, reducedMotion]);

  if (count === 0) return null;

  const current = index % count;
  const go = (next: number) => setIndex((next + count) % count);
  const showControls = count > 1;

  return (
    <div
      className="group relative w-full overflow-hidden bg-muted"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Ảnh banner trang chủ"
    >
      <div className="relative aspect-[16/10] min-h-[240px] w-full sm:aspect-[16/7] sm:min-h-[460px] lg:min-h-[560px]">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            aria-hidden={i !== current}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.image_url}
              alt={slide.alt ?? ""}
              fill
              priority={i === 0}
              sizes="100vw"
              className={`object-cover ${
                i === current && !reducedMotion ? "animate-[hero-zoom_7s_ease-out_forwards]" : ""
              }`}
            />
          </div>
        ))}

        {/* Điều khiển glass — góc phải-dưới (thu nhỏ gọn gàng ở mobile) */}
        {showControls && (
          <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-0.5 rounded-full bg-black/30 p-0.5 ring-1 ring-white/20 backdrop-blur-md sm:bottom-5 sm:right-5 sm:gap-1 sm:p-1">
            <button
              type="button"
              onClick={() => go(current - 1)}
              aria-label="Ảnh trước"
              className="grid h-6 w-6 place-items-center rounded-full text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 sm:h-8 sm:w-8"
            >
              <ChevronLeft size={14} className="sm:size-[18px]" />
            </button>

            <div className="flex items-center gap-0.5 px-0.5 sm:px-1">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Đến ảnh ${i + 1}`}
                  aria-current={i === current}
                  className="grid h-5 w-5 place-items-center rounded-full focus-visible:ring-2 focus-visible:ring-white/60 sm:h-6 sm:w-6"
                >
                  <span
                    className={`rounded-full transition-all ${
                      i === current
                        ? "h-1.5 w-3.5 bg-white sm:h-2.5 sm:w-5"
                        : "h-1.5 w-1.5 bg-white/50 hover:bg-white/80 sm:h-2.5 sm:w-2.5"
                    }`}
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => go(current + 1)}
              aria-label="Ảnh kế tiếp"
              className="grid h-6 w-6 place-items-center rounded-full text-white transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 sm:h-8 sm:w-8"
            >
              <ChevronRight size={14} className="sm:size-[18px]" />
            </button>
          </div>
        )}

        {/* Thanh đếm autoplay dưới đáy */}
        {showControls && !reducedMotion && (
          <div
            key={current}
            aria-hidden
            className="absolute bottom-0 left-0 right-0 h-[3px] origin-left bg-white/70"
            style={{
              animation: `hero-progress ${AUTOPLAY_MS}ms linear`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        )}
      </div>
    </div>
  );
}
