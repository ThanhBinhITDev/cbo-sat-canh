import { MessageSquareHeart } from "lucide-react";
import SectionHeading from "./SectionHeading";
import ContactForm from "./ContactForm";
import type { ContactInfo } from "@/lib/types";

/** Section form "hỏi thêm" ngay trên trang chủ. */
export default function ContactFormSection({ contact }: { contact: ContactInfo }) {
  return (
    <section
      id="hoi-them"
      className="section"
      style={{ background: "var(--brand-muted)" }}
    >
      <div className="container-site grid gap-10 lg:grid-cols-[0.85fr,1.15fr]">
        <div>
          <SectionHeading
            kicker="Hỏi thêm"
            title="Bạn cần hỗ trợ gì?"
            description="Điền thông tin bên cạnh, chúng tôi sẽ liên hệ lại trong thời gian sớm nhất. Tất cả câu hỏi được bảo mật tuyệt đối."
            align="left"
          />

          <ul className="space-y-4">
            {[
              {
                title: "Bảo mật 100%",
                desc: "Thông tin chỉ dùng để tư vấn, không chia sẻ cho bên thứ ba.",
              },
              {
                title: "Phản hồi nhanh",
                desc: "Chúng tôi phản hồi trong giờ hành chính, ưu tiên các trường hợp khẩn cấp.",
              },
              {
                title: "Không kỳ thị",
                desc: "Mọi câu hỏi đều được lắng nghe với sự tôn trọng và thấu hiểu.",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: "var(--brand-primary)" }}
                />
                <span>
                  <b className="text-primary-dark">{item.title}</b>
                  <span className="block text-sm leading-relaxed text-ink/70">
                    {item.desc}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-surface px-4 py-3 text-sm shadow-sm">
            <MessageSquareHeart size={18} className="text-primary" />
            Cần hỗ trợ khẩn cấp? Gọi{" "}
            <b className="text-primary-dark">{contact.hotline.join(" – ")}</b>
          </div>
        </div>

        <div className="card p-6 sm:p-8">
          <ContactForm contact={contact} />
        </div>
      </div>
    </section>
  );
}
