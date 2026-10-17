import { Field, Toggle } from "@/components/admin/ui";
import { ToastForm } from "@/components/admin/ProfileForms";
import { saveMedal } from "@/lib/admin/collab-actions";
import { MEDAL_TIER_ORDER, TIER_LABELS, type Medal } from "@/lib/types";

/** Biểu mẫu thêm/sửa danh mục huy chương (chỉ admin). */
export default function MedalForm({ medal }: { medal?: Medal | null }) {
  return (
    <ToastForm
      action={saveMedal}
      loading={medal ? "Đang lưu huy chương..." : "Đang thêm huy chương..."}
      className="space-y-4 p-5"
    >
      {medal && <input type="hidden" name="id" value={medal.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên huy chương" required>
          <input
            name="name"
            defaultValue={medal?.name ?? ""}
            required
            maxLength={120}
            placeholder="Ví dụ: Trụ cột"
            className="input"
          />
        </Field>
        <Field label="Mã (không dấu, dùng cho kỹ thuật)" required>
          <input
            name="key"
            defaultValue={medal?.key ?? ""}
            required
            maxLength={60}
            placeholder="vi-du: tru-cot"
            className="input"
          />
        </Field>
      </div>

      <Field label="Mô tả">
        <input
          name="description"
          defaultValue={medal?.description ?? ""}
          maxLength={500}
          className="input"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Cấp bậc">
          <select name="tier" defaultValue={medal?.tier ?? "bronze"} className="select">
            {MEDAL_TIER_ORDER.slice()
              .reverse()
              .map((t) => (
                <option key={t} value={t}>
                  {TIER_LABELS[t]}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Ngưỡng điểm" hint="0 = trao tay">
          <input
            type="number"
            name="threshold_points"
            defaultValue={medal?.threshold_points ?? 0}
            min={0}
            className="input"
          />
        </Field>
        <Field label="Thứ tự hiển thị">
          <input
            type="number"
            name="sort_order"
            defaultValue={medal?.sort_order ?? 0}
            className="input"
          />
        </Field>
      </div>

      <Toggle
        name="is_active"
        label="Đang hoạt động"
        hint="Huy chương đang hoạt động mới hiện khi trao"
        defaultChecked={medal?.is_active ?? true}
      />

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn btn-primary flex-1 py-2.5 text-sm">
          {medal ? "Lưu thay đổi" : "Thêm huy chương"}
        </button>
      </div>
    </ToastForm>
  );
}
