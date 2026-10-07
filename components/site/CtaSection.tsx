import Link from "next/link";
import { ArrowRight, HandHeart } from "lucide-react";
import NewsletterForm from "./NewsletterForm";
import type { ContactInfo } from "@/lib/types";

export default function CtaSection({ contact }: { contact: ContactInfo }) {
  return (
    <section
      className="section relative overflow-hidden bg-muted text-ink"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="container-site relative grid gap-10 lg:grid-cols-2">
        <div>
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-dark">
            <HandHeart size={14} /> Cần hỗ trợ?
          </span>
          <h2 className="text-[clamp(1.6rem,3.4vw,2.4rem)] font-extrabold leading-tight text-primary-dark">
            Đừng ngần ngại hỏi thêm — mọi câu hỏi đều được lắng nghe
          </h2>
          <p className="mt-4 max-w-lg text-ink/90">
            Tư vấn miễn phí, bảo mật tuyệt đối, không kỳ thị. Chúng tôi sẵn sàng
            đồng hành cùng bạn và người thân.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/lien-he" className="btn btn-primary">
              Đặt câu hỏi ngay <ArrowRight size={18} />
            </Link>
            <a
              href={`tel:${(contact.hotline[0] ?? "").replace(/\D/g, "")}`}
              className="btn btn-ghost border border-line text-ink hover:bg-surface"
            >
              Gọi {contact.hotline[0]}
            </a>
          </div>
        </div>

        <div className="rounded-3xl bg-surface border border-line p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-bold text-primary-dark">Đăng ký nhận tin</h3>
          <p className="mb-4 mt-1 text-sm text-ink/80">
            Nhận thông tin về hoạt động, sự kiện và chương trình chăm sóc sức
            khỏe cộng đồng từ CBO Sát Cánh.
          </p>
          <div>
            <NewsletterForm source="cta" />
          </div>
        </div>
      </div>
    </section>
  );
}
