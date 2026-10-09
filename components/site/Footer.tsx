import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, Clock, HeartHandshake } from "lucide-react";
import type { ContactInfo } from "@/lib/types";

type Props = {
  contact: ContactInfo;
  slogan: string;
  copyright: string;
  address: string;
};

const QUICK_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/#gioi-thieu", label: "Giới thiệu" },
  { href: "/#dich-vu", label: "Dịch vụ" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/lien-he", label: "Liên hệ" },
];

const SERVICES = [
  "Xét nghiệm nhanh HIV/STIs",
  "Dự phòng trước phơi nhiễm (PrEP)",
  "Dự phòng sau phơi nhiễm (PEP)",
  "Chuyển gửi điều trị HIV (ARV)",
];

export default function Footer({ contact, slogan, copyright, address }: Props) {
  return (
    <footer className="mt-auto bg-primary-dark text-white">
      <div className="container-site grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image
            src="/images/brand/logo-cau.png"
            alt="Logo CBO Sát Cánh"
            width={200}
            height={52}
            className="h-12 w-auto"
          />
          <p className="mt-4 text-sm leading-relaxed text-white/75">{slogan}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
            <HeartHandshake size={14} /> Thành lập 04/12/2022
          </p>
        </div>

        <nav aria-label="Liên kết nhanh">
          <h2 className="mb-4 text-base font-bold text-white">Liên kết nhanh</h2>
          <ul className="space-y-2.5 text-sm text-white/75">
            {QUICK_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-4 text-base font-bold text-white">Dịch vụ</h2>
          <ul className="space-y-2.5 text-sm text-white/75">
            {SERVICES.map((s) => (
              <li key={s}>
                <Link href="/#dich-vu" className="transition hover:text-white">
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-base font-bold text-white">Liên hệ</h2>
          <ul className="space-y-3 text-sm text-white/75">
            <li className="flex gap-2.5">
              <Phone size={16} className="mt-0.5 shrink-0 text-white/60" />
              <span className="flex flex-col">
                {contact.hotline.map((h) => (
                  <a
                    key={h}
                    href={`tel:${h.replace(/\D/g, "")}`}
                    className="transition hover:text-white"
                  >
                    {h}
                  </a>
                ))}
              </span>
            </li>
            <li className="flex gap-2.5">
              <Mail size={16} className="mt-0.5 shrink-0 text-white/60" />
              <a href={`mailto:${contact.email}`} className="transition hover:text-white">
                {contact.email}
              </a>
            </li>
            {address && (
              <li className="flex gap-2.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-white/60" />
                <span>{address}</span>
              </li>
            )}
            <li className="flex gap-2.5">
              <Clock size={16} className="mt-0.5 shrink-0 text-white/60" />
              <span>{contact.working_hours}</span>
            </li>
            <li>
              <a
                href={contact.fanpage_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-semibold text-white transition hover:bg-white/20"
              >
                𝐅 {contact.fanpage}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/15">
        <div className="container-site flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/60 sm:flex-row">
          <p>{copyright}</p>
          <p>Y tế cộng đồng · Phòng chống HIV/AIDS · Thiện nguyện xã hội</p>
        </div>
      </div>
      <div className="h-[68px] md:hidden" />
    </footer>
  );
}
