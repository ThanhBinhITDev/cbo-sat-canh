import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import type { HeroContent } from "@/lib/types";

export default function Hero({ hero }: { hero: HeroContent }) {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-[72px]"
      style={{
        background:
          "linear-gradient(140deg, color-mix(in srgb, var(--brand-primary) 14%, var(--brand-surface)) 0%, var(--brand-surface) 45%, color-mix(in srgb, var(--brand-muted) 80%, var(--brand-surface)) 100%)",
      }}
    >
      {/* Trang trí */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--brand-primary)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-24 h-[360px] w-[360px] rounded-full opacity-15 blur-3xl"
        style={{ background: "var(--brand-dark)" }}
      />

      <div className="container-site relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          {hero.badge && (
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-bold text-primary-dark shadow-sm">
              <Sparkles size={14} className="text-primary" /> {hero.badge}
            </p>
          )}

          <h1 className="text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.12] tracking-tight text-primary-dark">
            {hero.title}
          </h1>

          <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-ink/75">
            {hero.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={hero.cta_href || "/lien-he"} className="btn btn-primary">
              {hero.cta_label} <ArrowRight size={18} />
            </Link>
            <Link href="/#dich-vu" className="btn btn-ghost">
              Xem dịch vụ
            </Link>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-ink/70">
            <li className="inline-flex items-center gap-2">
              <ShieldCheck size={17} className="text-primary" /> Bảo mật tuyệt đối
            </li>
            <li className="inline-flex items-center gap-2">
              <ShieldCheck size={17} className="text-primary" /> Không kỳ thị
            </li>
            <li className="inline-flex items-center gap-2">
              <ShieldCheck size={17} className="text-primary" /> Tư vấn miễn phí
            </li>
          </ul>
        </div>

        <div className="relative">
          <div className="card overflow-hidden !rounded-3xl">
            {hero.image ? (
              <Image
                src={hero.image}
                alt={hero.title}
                width={960}
                height={720}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="grid aspect-[4/3] w-full place-items-center p-8 text-center"
                style={{
                  background:
                    "linear-gradient(135deg, var(--brand-primary), var(--brand-dark))",
                }}
              >
                <div className="text-white">
                  <Image
                    src="/images/brand/logo-vong-tron.png"
                    alt="CBO Sát Cánh"
                    width={260}
                    height={260}
                    className="mx-auto mb-5 h-40 w-auto opacity-95 drop-shadow-xl"
                  />
                  <p className="text-lg font-bold">CBO SÁT CÁNH</p>
                  <p className="mt-1 text-sm text-white/80">
                    Y tế cộng đồng &amp; thiện nguyện xã hội
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="absolute -bottom-5 left-4 hidden rounded-2xl border border-line bg-surface px-5 py-3 shadow-xl sm:block lg:-left-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">
              Hotline
            </p>
            <p className="text-lg font-extrabold text-primary-dark">0967.206.095</p>
          </div>
        </div>
      </div>
    </section>
  );
}
