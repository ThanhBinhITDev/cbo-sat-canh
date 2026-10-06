import {
  TestTube,
  ShieldCheck,
  ClockAlert,
  HeartPulse,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "./SectionHeading";
import type { Service } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  "test-tube": TestTube,
  "shield-check": ShieldCheck,
  "clock-alert": ClockAlert,
  "heart-pulse": HeartPulse,
  stethoscope: Stethoscope,
};

export default function ServicesSection({ services }: { services: Service[] }) {
  return (
    <section id="dich-vu" className="section bg-surface">
      <div className="container-site">
        <SectionHeading
          kicker="Dịch vụ"
          title="Dịch vụ y tế cộng đồng"
          description="Các dịch vụ được triển khai miễn phí, bảo mật và không kỳ thị tại cộng đồng."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => {
            const Icon = ICONS[service.icon ?? ""] ?? Stethoscope;
            const color = service.color ?? "var(--brand-primary)";
            return (
              <article key={service.id} className="card card-hover flex flex-col p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className="grid h-14 w-14 place-items-center rounded-2xl text-white"
                    style={{ background: color }}
                  >
                    <Icon size={26} />
                  </div>
                  <span className="text-3xl font-black text-line">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="mb-2 text-lg font-bold leading-snug">
                  {service.title}
                </h3>
                {service.description && (
                  <p className="mb-5 text-sm leading-relaxed text-ink/70">
                    {service.description}
                  </p>
                )}

                <Link
                  href={`/lien-he?dich-vu=${encodeURIComponent(service.slug ?? service.title)}`}
                  className="mt-auto inline-flex items-center gap-1.5 text-sm font-bold text-primary transition hover:gap-2.5"
                >
                  Tư vấn ngay <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
