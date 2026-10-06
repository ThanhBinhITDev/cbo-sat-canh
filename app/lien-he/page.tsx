import type { Metadata } from "next";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import ThemeSwitcher from "@/components/site/ThemeSwitcher";
import FloatingContact from "@/components/site/FloatingContact";
import ContactForm from "@/components/site/ContactForm";
import MapContactSection from "@/components/site/MapContactSection";
import SectionHeading from "@/components/site/SectionHeading";
import { getContent } from "@/lib/settings";
import { SERVICE_OPTIONS } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Liên hệ & Tư vấn",
  description:
    "Liên hệ CBO Sát Cánh để được tư vấn miễn phí về xét nghiệm HIV/STIs, PrEP, PEP và chuyển gửi điều trị ARV.",
};

/** Đánh giá dịch vụ từ query ?dich-vu=slug → chọn sẵn trong dropdown. */
function matchService(value?: string) {
  if (!value) return undefined;
  const raw = value.trim();
  const direct = SERVICE_OPTIONS.find((o) => o.value === raw);
  if (direct) return direct.value;

  const normalized = raw.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  const loose = SERVICE_OPTIONS.find((o) =>
    o.label
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .includes(normalized),
  );
  if (loose) return loose.value;

  if (normalized.includes("prep")) return "prep";
  if (normalized.includes("pep")) return "pep";
  if (normalized.includes("arv")) return "arv";
  if (normalized.includes("xet nghiem") || normalized.includes("hiv")) return "test";
  return undefined;
}

export default async function ContactPage({
  searchParams,
}: PageProps<"/lien-he">) {
  const params = await searchParams;
  const content = await getContent();
  const service = matchService(
    typeof params["dich-vu"] === "string" ? params["dich-vu"] : undefined,
  );

  return (
    <>
      <Header contact={content.contact} />
      <main className="flex-1 pt-[72px]">
        <div
          className="border-b border-line"
          style={{ background: "var(--brand-muted)" }}
        >
          <div className="container-site py-12 text-center">
            <span className="section-kicker">Liên hệ</span>
            <h1 className="section-title">Kết nối với CBO Sát Cánh</h1>
            <p className="mx-auto mt-3 max-w-2xl text-ink/70">
              Tư vấn miễn phí, bảo mật tuyệt đối, không kỳ thị. Đặt câu hỏi hoặc
              gọi trực tiếp cho chúng tôi.
            </p>
          </div>
        </div>

        <section className="section bg-surface">
          <div className="container-site grid gap-10 lg:grid-cols-[0.8fr,1.2fr]">
            <div>
              <SectionHeading
                kicker="Gọi trực tiếp"
                title="Bạn muốn trao đổi ngay?"
                description="Đường dây nóng hoạt động trong giờ hành chính, ưu tiên các trường hợp khẩn cấp."
                align="left"
              />

              <div className="space-y-4">
                {content.contact.hotline.map((h) => (
                  <a
                    key={h}
                    href={`tel:${h.replace(/\D/g, "")}`}
                    className="card card-hover flex items-center gap-4 p-5"
                  >
                    <span
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-black text-white"
                      style={{ background: "var(--brand-primary)" }}
                    >
                      ☎
                    </span>
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-wide text-ink/50">
                        Hotline
                      </span>
                      <span className="text-xl font-extrabold text-primary-dark">
                        {h}
                      </span>
                    </span>
                  </a>
                ))}

                <a
                  href={`mailto:${content.contact.email}`}
                  className="card card-hover flex items-center gap-4 p-5"
                >
                  <span
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-black text-white"
                    style={{ background: "var(--brand-dark)" }}
                  >
                    ✉
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-wide text-ink/50">
                      Email
                    </span>
                    <span className="break-all font-bold text-primary-dark">
                      {content.contact.email}
                    </span>
                  </span>
                </a>

                <a
                  href={content.contact.fanpage_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card card-hover flex items-center gap-4 p-5"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#1877F2] text-lg font-black text-white">
                    𝐅
                  </span>
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-wide text-ink/50">
                      Fanpage
                    </span>
                    <span className="font-bold text-primary-dark">
                      {content.contact.fanpage}
                    </span>
                  </span>
                </a>
              </div>
            </div>

            <div className="card p-6 sm:p-8">
              <h2 className="mb-1 text-xl font-bold">Gửi câu hỏi cho chúng tôi</h2>
              <p className="mb-6 text-sm text-ink/65">
                Điền thông tin, chúng tôi sẽ liên hệ lại sớm nhất.
              </p>
              <ContactForm contact={content.contact} defaultService={service} />
            </div>
          </div>
        </section>

        <MapContactSection contact={content.contact} map={content.map} />
      </main>

      <Footer
        contact={content.contact}
        slogan={content.footer.slogan}
        copyright={content.footer.copyright}
        address={content.contact.address}
      />
      <FloatingContact contact={content.contact} />
      <ThemeSwitcher />
    </>
  );
}
