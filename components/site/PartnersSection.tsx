import Image from "next/image";
import SectionHeading from "./SectionHeading";
import type { Partner, PartnerGroup } from "@/lib/types";

export default function PartnersSection({
  partners,
  groups,
}: {
  partners: Partner[];
  groups: PartnerGroup[];
}) {
  return (
    <section id="doi-tac" className="section bg-surface">
      <div className="container-site">
        <SectionHeading
          kicker="Hợp tác"
          title="Đối tác của chúng tôi"
          description="Sự đồng hành của các tổ chức, cơ sở y tế và mạng lưới cộng đồng là nền tảng cho mọi hoạt động của CBO Sát Cánh."
        />

        <div className="space-y-8">
          {groups.map((group) => {
            const items = partners.filter((p) => p.group === group.key);
            if (!items.length) return null;

            return (
              <div key={group.key}>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-bold text-primary-dark">
                    {group.title}
                  </h3>
                  {group.subtitle && (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-ink/65">
                      {group.subtitle}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {items.map((partner) => {
                    const inner = (
                      <div className="card card-hover flex h-full items-center justify-center p-4">
                        {partner.logo_url ? (
                          <Image
                            src={partner.logo_url}
                            alt={`Logo ${partner.name}`}
                            width={200}
                            height={120}
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                            className="h-20 w-full object-contain"
                          />
                        ) : (
                          <span className="line-clamp-3 text-center text-xs font-semibold text-ink/45">
                            {partner.name}
                          </span>
                        )}
                      </div>
                    );

                    return partner.website_url ? (
                      <a
                        key={partner.id}
                        href={partner.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {inner}
                      </a>
                    ) : (
                      <div key={partner.id}>{inner}</div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
