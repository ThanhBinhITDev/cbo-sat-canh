"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  accent: boolean;
};

function readVar(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/**
 * Nền hạt trôi nối đường — màu đọc từ biến theme (--brand-primary/--brand-accent),
 * tự đổi theo ThemeSwitcher. Tôn trọng prefers-reduced-motion và tạm dừng khi
 * ra khỏi màn hình hoặc tab bị ẩn.
 */
export default function Particles({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;

    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let primary = "#279cd7";
    let accent = "#ffb020";
    let frame = 0;
    let running = false;
    let inView = true;
    let reduced = reduceMq.matches;

    const refreshColors = () => {
      primary = readVar("--brand-primary", primary);
      accent = readVar("--brand-accent", accent);
    };

    const spawn = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 1.1,
      accent: Math.random() < 0.22,
    });

    const build = () => {
      const target = Math.round((width * height) / 14000);
      const count = Math.max(28, Math.min(110, target));
      particles = Array.from({ length: count }, spawn);
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      draw();
    };

    const linkDist = () => Math.min(170, Math.max(110, width / 8));

    const step = () => {
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x <= 0 || p.x >= width) p.vx *= -1;
        if (p.y <= 0 || p.y >= height) p.vy *= -1;
        p.x = Math.max(0, Math.min(width, p.x));
        p.y = Math.max(0, Math.min(height, p.y));
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const max = linkDist();

      const a = particles;
      ctx.lineWidth = 1;
      for (let i = 0; i < a.length; i++) {
        for (let j = i + 1; j < a.length; j++) {
          const dx = a[i].x - a[j].x;
          const dy = a[i].y - a[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 > max * max) continue;
          const dist = Math.sqrt(d2);
          ctx.globalAlpha = (1 - dist / max) * 0.7;
          ctx.strokeStyle = primary;
          ctx.beginPath();
          ctx.moveTo(a[i].x, a[i].y);
          ctx.lineTo(a[j].x, a[j].y);
          ctx.stroke();
        }
      }

      for (const p of a) {
        ctx.globalAlpha = p.accent ? 1 : 0.95;
        ctx.fillStyle = p.accent ? accent : primary;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      step();
      draw();
      frame = requestAnimationFrame(loop);
    };

    const sync = () => {
      const shouldRun = !reduced && inView && document.visibilityState === "visible";
      if (shouldRun && !running) {
        running = true;
        frame = requestAnimationFrame(loop);
      } else if (!shouldRun) {
        running = false;
        cancelAnimationFrame(frame);
        if (reduced || !inView) draw();
      }
    };

    // Màu thay đổi khi khách chỉnh giao diện (ghi vào style của <html>).
    const colorObserver = new MutationObserver(() => {
      refreshColors();
      if (!running) draw();
    });
    colorObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style"],
    });

    const sizeObserver = new ResizeObserver(resize);

    const viewObserver = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );

    const onReduceChange = () => {
      reduced = reduceMq.matches;
      sync();
    };

    const onVisibility = () => sync();

    refreshColors();
    resize();
    sizeObserver.observe(parent);
    viewObserver.observe(canvas);
    reduceMq.addEventListener("change", onReduceChange);
    document.addEventListener("visibilitychange", onVisibility);
    sync();

    return () => {
      cancelAnimationFrame(frame);
      colorObserver.disconnect();
      sizeObserver.disconnect();
      viewObserver.disconnect();
      reduceMq.removeEventListener("change", onReduceChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
