"use client";

import { useState, type ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveContentSection } from "@/lib/admin/actions";
import { Field, Panel, PanelHead } from "./ui";

type Json = Record<string, unknown>;

export const SECTIONS = [
  { key: "hero", label: "Banner trang chủ" },
  { key: "about", label: "Giới thiệu" },
  { key: "vision", label: "Tầm nhìn" },
  { key: "mission", label: "Sứ mệnh" },
  { key: "values", label: "Giá trị cốt lõi" },
  { key: "contact", label: "Liên hệ" },
  { key: "map", label: "Bản đồ" },
  { key: "footer", label: "Footer" },
  { key: "seo", label: "SEO" },
] as const;

export type SectionKey = (typeof SECTIONS)[number]["key"];

type Props = { section: SectionKey; initial: Json };

function asArray(value: unknown): Json[] {
  return Array.isArray(value) ? (value as Json[]) : [];
}

export default function ContentEditor({ section, initial }: Props) {
  const [data, setData] = useState<Json>(() => ({ ...initial }));

  const set = (key: string, value: unknown) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const title = SECTIONS.find((s) => s.key === section)?.label ?? section;

  return (
    <Panel>
      <PanelHead
        title={title}
        subtitle="Thay đổi tại đây áp dụng cho toàn bộ trang khách sau khi lưu."
      />

      <form action={saveContentSection} className="space-y-5 p-5">
        <input type="hidden" name="section" value={section} />
        <input type="hidden" name="payload" value={JSON.stringify(data)} />

        <Fields section={section} data={data} set={set} />

        <div className="flex items-center gap-3 border-t border-line pt-4">
          <button type="submit" className="btn btn-primary py-2.5 text-sm">
            Lưu thay đổi
          </button>
        </div>
      </form>
    </Panel>
  );
}

function Fields({
  section,
  data,
  set,
}: {
  section: SectionKey;
  data: Json;
  set: (key: string, value: unknown) => void;
}) {
  const text = (key: string) => String(data[key] ?? "");

  switch (section) {
    case "hero":
      return (
        <>
          <Field label="Dòng nhãn nhỏ" hint="Ví dụ: Thành lập 04/12/2022">
            <input className="input" value={text("badge")} onChange={(e) => set("badge", e.target.value)} />
          </Field>
          <Field label="Tiêu đề chính" required>
            <input className="input" value={text("title")} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Mô tả">
            <textarea className="textarea" rows={4} value={text("subtitle")} onChange={(e) => set("subtitle", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nhãn nút">
              <input className="input" value={text("cta_label")} onChange={(e) => set("cta_label", e.target.value)} />
            </Field>
            <Field label="Liên kết nút">
              <input className="input" value={text("cta_href")} onChange={(e) => set("cta_href", e.target.value)} />
            </Field>
          </div>
          <Field label="Ảnh banner (URL)" hint="Để trống sẽ dùng nền gradient nhận diện">
            <input className="input" value={text("image")} onChange={(e) => set("image", e.target.value || null)} />
          </Field>
        </>
      );

    case "about":
      return (
        <>
          <ListField
            label="Đoạn văn giới thiệu"
            items={asArray(data.paragraphs).map((p) => String(p ?? ""))}
            onChange={(next) => set("paragraphs", next)}
            placeholder="Nội dung đoạn văn..."
            rows={4}
            addLabel="Thêm đoạn"
            emptyHint="Chưa có đoạn văn nào."
          />
          <div className="border-t border-line pt-4">
            <p className="label">Số liệu nổi bật</p>
            <div className="space-y-3">
              {asArray(data.stats).map((s, i) => (
                <div key={i} className="grid gap-3 sm:grid-cols-[160px,1fr,auto] sm:items-end">
                  <Field label="Giá trị">
                    <input
                      className="input"
                      value={String(s.value ?? "")}
                      onChange={(e) => {
                        const next = asArray(data.stats);
                        next[i] = { ...s, value: e.target.value };
                        set("stats", next);
                      }}
                    />
                  </Field>
                  <Field label="Nhãn">
                    <input
                      className="input"
                      value={String(s.label ?? "")}
                      onChange={(e) => {
                        const next = asArray(data.stats);
                        next[i] = { ...s, label: e.target.value };
                        set("stats", next);
                      }}
                    />
                  </Field>
                  <button
                    type="button"
                    onClick={() => set("stats", asArray(data.stats).filter((_, j) => j !== i))}
                    className="mb-0.5 grid h-10 w-10 place-items-center rounded-xl border border-line text-red-500 hover:bg-red-50"
                    aria-label="Xoá dòng"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {asArray(data.stats).length === 0 && (
                <p className="text-sm text-ink/55">Chưa có số liệu nào.</p>
              )}
              <button
                type="button"
                onClick={() => set("stats", [...asArray(data.stats), { value: "", label: "" }])}
                className="btn btn-ghost px-4 py-2 text-xs"
              >
                <Plus size={15} /> Thêm số liệu
              </button>
            </div>
          </div>
        </>
      );

    case "vision":
    case "mission":
      return (
        <>
          <Field label="Tiêu đề">
            <input className="input" value={text("heading")} onChange={(e) => set("heading", e.target.value)} />
          </Field>
          <Field label="Nội dung">
            <textarea className="textarea" rows={5} value={text("body")} onChange={(e) => set("body", e.target.value)} />
          </Field>
        </>
      );

    case "values":
      return (
        <div className="space-y-4">
          {asArray(data.values).map((v, i) => (
            <div key={i} className="rounded-2xl border border-line p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-ink/50">
                  Giá trị #{i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => set("values", asArray(data.values).filter((_, j) => j !== i))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-line text-red-500 hover:bg-red-50"
                  aria-label="Xoá"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="space-y-3">
                <Field label="Tên giá trị">
                  <input
                    className="input"
                    value={String(v.title ?? "")}
                    onChange={(e) => {
                      const next = asArray(data.values);
                      next[i] = { ...v, title: e.target.value };
                      set("values", next);
                    }}
                  />
                </Field>
                <Field label="Mô tả">
                  <textarea
                    className="textarea !min-h-[4rem]"
                    rows={2}
                    value={String(v.description ?? "")}
                    onChange={(e) => {
                      const next = asArray(data.values);
                      next[i] = { ...v, description: e.target.value };
                      set("values", next);
                    }}
                  />
                </Field>
              </div>
            </div>
          ))}
          {asArray(data.values).length === 0 && (
            <p className="text-sm text-ink/55">Chưa có giá trị nào.</p>
          )}
          <button
            type="button"
            onClick={() => set("values", [...asArray(data.values), { title: "", description: "" }])}
            className="btn btn-ghost px-4 py-2 text-xs"
          >
            <Plus size={15} /> Thêm giá trị
          </button>
        </div>
      );

    case "contact": {
      const hotline = Array.isArray(data.hotline) ? (data.hotline as string[]) : [];
      return (
        <>
          <Field label="Hotline" hint="Mỗi dòng một số điện thoại">
            <textarea
              className="textarea !min-h-[5rem]"
              rows={3}
              value={hotline.join("\n")}
              onChange={(e) =>
                set(
                  "hotline",
                  e.target.value.split("\n").map((x) => x.trim()).filter(Boolean),
                )
              }
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" required>
              <input className="input" type="email" value={text("email")} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Giờ làm việc">
              <input className="input" value={text("working_hours")} onChange={(e) => set("working_hours", e.target.value)} />
            </Field>
            <Field label="Tên Fanpage">
              <input className="input" value={text("fanpage")} onChange={(e) => set("fanpage", e.target.value)} />
            </Field>
            <Field label="Link Fanpage">
              <input className="input" value={text("fanpage_url")} onChange={(e) => set("fanpage_url", e.target.value)} />
            </Field>
            <Field label="Số Zalo">
              <input className="input" value={text("zalo")} onChange={(e) => set("zalo", e.target.value)} />
            </Field>
            <Field label="Địa chỉ">
              <input className="input" value={text("address")} onChange={(e) => set("address", e.target.value)} />
            </Field>
          </div>
        </>
      );
    }

    case "map":
      return (
        <>
          <Field
            label="Mã nhúng Google Maps"
            hint='Vào Google Maps → Chia sẻ → Nhúng bản đồ → copy nội dung <iframe ...>'
          >
            <textarea
              className="textarea font-mono !text-xs"
              rows={5}
              value={text("embed")}
              onChange={(e) => set("embed", e.target.value)}
              placeholder='<iframe src="https://www.google.com/maps/embed?..." ...></iframe>'
            />
          </Field>
          <Field label="Địa chỉ hiển thị">
            <input className="input" value={text("address")} onChange={(e) => set("address", e.target.value)} />
          </Field>
        </>
      );

    case "footer":
      return (
        <>
          <Field label="Câu khẩu hiệu">
            <textarea className="textarea" rows={3} value={text("slogan")} onChange={(e) => set("slogan", e.target.value)} />
          </Field>
          <Field label="Dòng bản quyền">
            <input className="input" value={text("copyright")} onChange={(e) => set("copyright", e.target.value)} />
          </Field>
        </>
      );

    case "seo":
      return (
        <>
          <Field label="Tiêu đề SEO" hint={`${text("title").length}/60 ký tự`}>
            <input className="input" value={text("title")} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Mô tả SEO" hint={`${text("description").length}/160 ký tự`}>
            <textarea className="textarea" rows={3} value={text("description")} onChange={(e) => set("description", e.target.value)} />
          </Field>
        </>
      );

    default:
      return null;
  }
}

function ListField({
  label,
  items,
  onChange,
  placeholder,
  rows,
  addLabel,
  emptyHint,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  rows: number;
  addLabel: string;
  emptyHint: string;
}): ReactNode {
  return (
    <div className="space-y-3">
      <p className="label">{label}</p>
      {items.length === 0 && <p className="text-sm text-ink/55">{emptyHint}</p>}
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <textarea
            className="textarea"
            rows={rows}
            placeholder={placeholder}
            value={item}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-red-500 hover:bg-red-50"
            aria-label="Xoá đoạn"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, ""])} className="btn btn-ghost px-4 py-2 text-xs">
        <Plus size={15} /> {addLabel}
      </button>
    </div>
  );
}
