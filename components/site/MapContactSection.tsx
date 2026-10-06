import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { FacebookIcon } from "./BrandIcons";
import SectionHeading from "./SectionHeading";
import type { ContactInfo, MapContent } from "@/lib/types";

export default function MapContactSection({
  contact,
  map,
}: {
  contact: ContactInfo;
  map: MapContent;
}) {
  const items = [
    {
      icon: <Phone size={18} />,
      label: "Hotline",
      content: (
        <span className="flex flex-col">
          {contact.hotline.map((h) => (
            <a
              key={h}
              href={`tel:${h.replace(/\D/g, "")}`}
              className="font-semibold text-primary-dark transition hover:text-primary"
            >
              {h}
            </a>
          ))}
        </span>
      ),
    },
    {
      icon: <Mail size={18} />,
      label: "Email",
      content: (
        <a
          href={`mailto:${contact.email}`}
          className="break-all font-semibold text-primary-dark transition hover:text-primary"
        >
          {contact.email}
        </a>
      ),
    },
    {
      icon: <Clock size={18} />,
      label: "Thời gian hoạt động",
      content: <span>{contact.working_hours}</span>,
    },
    {
      icon: <FacebookIcon size={18} />,
      label: "Fanpage",
      content: (
        <a
          href={contact.fanpage_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary-dark transition hover:text-primary"
        >
          {contact.fanpage}
        </a>
      ),
    },
  ];

  return (
    <section id="lien-he" className="section bg-surface">
      <div className="container-site">
        <SectionHeading
          kicker="Bản đồ & Liên hệ"
          title="Kết nối với CBO Sát Cánh"
          description="Ghé thăm, gọi điện hoặc nhắn tin — chúng tôi luôn sẵn sàng lắng nghe."
        />

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="card overflow-hidden p-0">
            {map.embed ? (
              <div
                className="h-full min-h-[340px] w-full [&_iframe]:h-full [&_iframe]:min-h-[340px] [&_iframe]:w-full [&_iframe]:border-0"
                dangerouslySetInnerHTML={{ __html: map.embed }}
              />
            ) : (
              <div className="grid h-full min-h-[340px] place-items-center bg-muted p-8 text-center">
                <div>
                  <MapPin size={44} className="mx-auto mb-3 text-primary" />
                  <p className="font-semibold text-primary-dark">
                    Bản đồ chưa được cấu hình
                  </p>
                  <p className="mt-1 max-w-xs text-sm text-ink/60">
                    Quản trị viên vào mục <b>Nội dung tĩnh → Bản đồ</b> để dán mã
                    nhúng Google Maps.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="card p-7">
            <h3 className="mb-5 text-xl font-bold">Thông tin liên hệ</h3>
            <ul className="space-y-5">
              {items.map((item) => (
                <li key={item.label} className="flex gap-4">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white"
                    style={{ background: "var(--brand-primary)" }}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0 text-sm leading-relaxed">
                    <span className="mb-0.5 block text-xs font-bold uppercase tracking-wide text-ink/50">
                      {item.label}
                    </span>
                    {item.content}
                  </span>
                </li>
              ))}
              {contact.address && (
                <li className="flex gap-4">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white"
                    style={{ background: "var(--brand-dark)" }}
                  >
                    <MapPin size={18} />
                  </span>
                  <span className="min-w-0 text-sm leading-relaxed">
                    <span className="mb-0.5 block text-xs font-bold uppercase tracking-wide text-ink/50">
                      Địa chỉ
                    </span>
                    {contact.address}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
