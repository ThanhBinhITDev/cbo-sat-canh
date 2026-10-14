import Link from "next/link";
import { ArrowRight, ChevronDown, ShieldCheck, Sparkles } from "lucide-react";
import HeroSlider from "@/components/site/HeroSlider";
import type { HeroContent, HeroSlide } from "@/lib/types";

const TRUST_PILLS = [
  "Bảo mật tuyệt đối",
  "Không kỳ thị",
  "Tư vấn miễn phí",
] as const;

function HeroCopy({ hero, overlay }: { hero: HeroContent; overlay: boolean }) {
  return (
    <>
      {hero.badge && (
        <p
          className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold shadow-sm backdrop-blur-sm sm:mb-5 sm:gap-2 sm:px-4 sm:py-1.5 sm:text-xs ${
            overlay
              ? "border-none bg-white/15 text-white ring-1 ring-white/25"
              : "border border-line bg-surface/95 text-primary-dark"
          }`}
        >
          <Sparkles
            size={13}
            className={overlay ? "text-white sm:size-3.5" : "text-primary sm:size-3.5"}
          />{" "}
          {hero.badge}
        </p>
      )}

      <h1
        className={`text-balance text-[clamp(1.65rem,7vw,3.45rem)] font-extrabold leading-[1.14] tracking-tight break-words sm:text-[clamp(1.9rem,5.4vw,3.75rem)] sm:leading-[1.1] ${
          overlay ? "text-white" : "text-primary-dark"
        }`}
      >
        {hero.title}
      </h1>

      {/* Subtitle: trên mobile khi có overlay thì dời xuống dải sáng; sm+ hiển thị ngay trên ảnh */}
      <p
        className={`mt-4 max-w-xl text-balance text-base leading-relaxed sm:mt-5 sm:text-[1.05rem] ${
          overlay
            ? "hidden text-white/90 sm:block"
            : "text-ink/90"
        }`}
      >
        {hero.subtitle}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-8 sm:gap-3">
        <Link
          href={hero.cta_href || "/lien-he"}
          className="btn btn-primary group min-w-[160px] justify-center !py-2.5 !text-sm sm:min-w-[160px] sm:!py-3 sm:!text-sm"
        >
          {hero.cta_label}
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5 sm:size-[18px]"
          />
        </Link>
        {/* Ghost button: trên mobile dời xuống dải sáng; sm+ hiển thị cạnh nút chính */}
        {overlay ? (
          <span className="hidden sm:inline-flex">
            <Link
              href="/#dich-vu"
              className="btn min-w-[140px] border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            >
              Xem dịch vụ
            </Link>
          </span>
        ) : (
          <Link
            href="/#dich-vu"
            className="btn btn-ghost min-w-[140px]"
          >
            Xem dịch vụ
          </Link>
        )}
      </div>

      {/* Pills: trên mobile dời xuống dải sáng; sm+ hiển thị trên ảnh */}
      <ul
        className={`mt-8 flex-wrap items-center gap-1.5 sm:gap-2 ${
          overlay ? "hidden sm:flex" : "flex"
        }`}
      >
        {TRUST_PILLS.map((item) => (
          <li
            key={item}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur-sm sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm ${
              overlay
                ? "border-none bg-white/10 text-white ring-1 ring-white/20"
                : "border border-line bg-surface/98 text-ink/90"
            }`}
          >
            <ShieldCheck
              size={16}
              className={overlay ? "text-white sm:size-[17px]" : "text-primary sm:size-[17px]"}
            />
            <span className="whitespace-nowrap">{item}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Dải nội dung phụ cho mobile khi có slider: nằm dưới ảnh trên nền sáng, chữ tối */
function HeroBandMobile({ hero }: { hero: HeroContent }) {
  return (
    <div className="container-site py-6 sm:hidden">
      <div className="max-w-xl">
        <p className="text-balance text-sm leading-relaxed text-ink/85 sm:text-base">
          {hero.subtitle}
        </p>

        {/* Nút Xem dịch vụ nổi bật hơn với viền và nền brand xanh dịu */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href="/#dich-vu"
            className="group inline-flex items-center justify-center gap-2 rounded-xl border-1.5 border-primary/35 bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary-dark shadow-xs transition hover:bg-primary/20 active:translate-y-px"
          >
            Xem dịch vụ
            <ArrowRight
              size={15}
              className="text-primary transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* Dải cam kết: cuộn ngang mượt mà trên mobile để tránh rớt 1 pill lẻ (luật R3) */}
        <div className="-mx-5 overflow-x-auto px-5 scrollbar-none">
          <ul className="mt-5 flex w-max items-center gap-2">
            {TRUST_PILLS.map((item) => (
              <li
                key={item}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface/95 px-3 py-1 text-xs font-medium text-ink/85 shadow-sm"
              >
                <ShieldCheck size={14} className="text-primary" />
                <span className="whitespace-nowrap">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Hero({
  hero,
  slides,
}: {
  hero: HeroContent;
  slides: HeroSlide[];
}) {
  const visibleSlides = slides.filter((s) => s.is_active);
  const hasSlides = visibleSlides.length > 0;

  return (
    <section
      id="top"
      className="relative overflow-hidden pt-[72px]"
      style={{
        background:
          "radial-gradient(140% 120% at 0% 0%, color-mix(in srgb, var(--brand-primary) 6%, var(--brand-surface)) 0%, var(--brand-surface) 58%, color-mix(in srgb, var(--brand-muted) 68%, var(--brand-surface)) 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -left-32 h-[420px] w-[420px] rounded-full bg-primary-dark/8 blur-3xl"
      />

      {hasSlides ? (
        <div className="relative">
          {/* Vùng ảnh slider */}
          <div className="relative">
            <HeroSlider slides={visibleSlides} />

            {/* Scrim mobile: gradient từ trên xuống để chữ trắng ở nửa trên đọc rõ */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgba(10,18,34,0.85)] via-[rgba(10,18,34,0.55)] to-[rgba(10,18,34,0.15)] sm:hidden"
            />

            {/* Scrim tablet/desktop: gradient trái sang phải */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-[rgba(10,18,34,0.82)] via-[rgba(10,18,34,0.48)] to-transparent sm:block"
            />

            {/* Overlay chữ: mobile ở góc trên ảnh (pt-4.5 vừa khít tỷ lệ 16:10); sm+ căn giữa dọc toàn khung */}
            <div className="pointer-events-none absolute inset-0 z-10 flex items-start pt-4 sm:items-center sm:pt-0">
              <div className="container-site pointer-events-auto w-full py-1 sm:py-6">
                <div className="max-w-xl sm:max-w-2xl">
                  <HeroCopy hero={hero} overlay={true} />
                </div>
              </div>
            </div>
          </div>

          {/* Dải nội dung phụ cho mobile: subtitle + nút dịch vụ + pills trên nền sáng */}
          <HeroBandMobile hero={hero} />

          {/* Gợi ý cuộn xuống — nằm dưới slider trên nền sáng (chỉ tablet + desktop) */}
          <a
            href="#gioi-thieu"
            aria-label="Cuộn xuống"
            className="group mx-auto hidden w-full max-w-xs flex-col items-center gap-1 pb-8 pt-5 text-primary-dark transition hover:text-primary sm:flex"
          >
            <span
              aria-hidden
              className="h-7 w-px bg-gradient-to-b from-primary/10 to-primary/45"
            />
            <span
              aria-hidden
              className="flex h-7 w-[18px] justify-center rounded-full border-2 border-current pt-1"
            >
              <span className="h-2 w-[3px] animate-[hero-scroll-dot_1.6s_ease-in-out_infinite] rounded-full bg-current" />
            </span>
            <span className="text-[13px] font-semibold tracking-wide">Cuộn xuống</span>
            <ChevronDown size={16} className="-mt-0.5 animate-bounce" />
          </a>
        </div>
      ) : (
        /* Trường hợp chưa có slide: bố cục chữ tối truyền thống */
        <div className="container-site py-16 lg:py-24">
          <div className="max-w-2xl">
            <HeroCopy hero={hero} overlay={false} />
          </div>
        </div>
      )}
    </section>
  );
}
