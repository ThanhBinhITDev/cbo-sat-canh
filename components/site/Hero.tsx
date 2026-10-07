import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Phone } from "lucide-react";
import type { HeroContent } from "@/lib/types";

export default function Hero({ hero }: { hero: HeroContent }) {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-[72px]"
      style={{
        background:
          "radial-gradient(140% 120% at 0% 0%, color-mix(in srgb, var(--brand-primary) 6%, var(--brand-surface)) 0%, var(--brand-surface) 58%, color-mix(in srgb, var(--brand-muted) 68%, var(--brand-surface)) 100%)",
      }}
    >
      {/* Trang trí nền */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -left-32 h-[420px] w-[420px] rounded-full bg-primary-dark/8 blur-3xl"
      />

      <div className="container-site relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          {hero.badge && (
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/95 px-4 py-1.5 text-xs font-bold text-primary-dark shadow-sm backdrop-blur-sm transition hover:shadow-md">
              <Sparkles size={14} className="text-primary" /> {hero.badge}
            </p>
          )}

          <h1 className="text-balance text-[clamp(1.75rem,5.2vw,3.45rem)] font-extrabold leading-[1.1] tracking-tight text-primary-dark break-words">
            {hero.title}
          </h1>

          <p className="mt-5 max-w-xl text-balance text-base leading-relaxed text-ink/90 sm:text-[1.05rem]">
            {hero.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5 sm:gap-3">
            <Link href={hero.cta_href || "/lien-he"} className="btn btn-primary group min-w-[160px] justify-center">
              {hero.cta_label}
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link href="/#dich-vu" className="btn btn-ghost min-w-[140px] justify-center">
              Xem dịch vụ
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap items-center gap-1.5 sm:gap-2">
            {[
              "Bảo mật tuyệt đối",
              "Không kỳ thị",
              "Tư vấn miễn phí",
            ].map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/98 px-2.5 py-1 text-xs font-medium text-ink/90 shadow-sm backdrop-blur-sm sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm"
              >
                <ShieldCheck size={16} className="text-primary sm:size-[17px]" />
                <span className="whitespace-nowrap">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-2 lg:mt-0">
          <div className="relative overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-[0_24px_60px_-30px_rgba(39,156,215,0.25)] sm:rounded-3xl">
            {hero.image ? (
              <Image
                src={hero.image}
                alt={hero.title}
                width={960}
                height={720}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div
                className="relative grid aspect-[4/3] w-full place-items-center overflow-hidden p-6 text-center sm:p-8"
                style={{
                  background:
                    "radial-gradient(150% 150% at 50% 12%, color-mix(in srgb, var(--brand-primary) 8%, var(--brand-surface)) 0%, var(--brand-surface) 72%, color-mix(in srgb, var(--brand-muted) 65%, var(--brand-surface)) 100%)",
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-primary/10 blur-2xl sm:-top-28 sm:h-64 sm:w-64 sm:blur-3xl"
                />
                <div className="relative z-[1] flex flex-col items-center">
                  <Image
                    src="/images/brand/logo-vong-tron.png"
                    alt="CBO Sát Cánh"
                    width={260}
                    height={260}
                    className="mx-auto mb-4 h-28 w-auto sm:mb-5 sm:h-40"
                  />
                  <p className="text-base font-bold tracking-tight text-primary-dark sm:text-lg">
                    CBO SÁT CÁNH
                  </p>
                  <p className="mt-1 text-xs text-ink/90 sm:text-sm">
                    Y tế cộng đồng &amp; thiện nguyện xã hội
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="absolute -bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2.5 rounded-2xl border border-line bg-surface/98 px-4 py-2.5 shadow-lg backdrop-blur-sm xs:inline-flex sm:-bottom-6 sm:left-3 sm:translate-x-0 sm:gap-3 sm:px-5 sm:py-3 sm:shadow-xl lg:-left-6">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary sm:h-9 sm:w-9">
              <Phone size={15} />
            </span>
            <div className="leading-tight">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-ink/55 sm:text-[10px]">
                Hotline hỗ trợ
              </p>
              <p className="text-base font-extrabold text-primary-dark sm:text-lg">
                0967.206.095
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
