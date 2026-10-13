import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Flash,
  PageHeader,
  Panel,
  PanelHead,
  EmptyState,
} from "@/components/admin/ui";
import { ErrorState } from "@/components/admin/States";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import SlideForm from "@/components/admin/SlideForm";
import { getHeroSlidesAdmin } from "@/lib/admin/data";
import { deleteHeroSlide } from "@/lib/admin/actions";

export default async function SliderAdminPage({
  searchParams,
}: PageProps<"/admin/slider">) {
  const sp = await searchParams;
  const result = await getHeroSlidesAdmin();

  const editId = typeof sp.edit === "string" ? sp.edit : "";
  const editing = result.ok ? result.rows.find((r) => r.id === editId) : undefined;
  const openForm = !editId || Boolean(editing);
  const nextOrder = result.ok ? result.rows.length + 1 : 1;

  return (
    <>
      <PageHeader
        title="Slider trang chủ"
        description="Ảnh banner chạy tự động ở đầu trang chủ. Slide hiển thị theo thứ tự từ nhỏ đến lớn."
        action={
          <a href="/admin/slider" className="btn btn-primary px-4 py-2.5 text-sm">
            <Plus size={18} /> Thêm slide
          </a>
        }
      />

      <Flash
        flash={typeof sp.flash === "string" ? sp.flash : undefined}
        error={typeof sp.err === "string" ? sp.err : undefined}
      />

      {!result.ok ? (
        <ErrorState message={result.message} detail={result.detail} />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[1.4fr,1fr]">
          <Panel>
            <PanelHead
              title={`Danh sách slide (${result.rows.length})`}
              subtitle="Xoá hết slide → banner biến mất trên trang chủ"
            />
            {result.rows.length === 0 ? (
              <EmptyState
                title="Chưa có slide nào"
                description="Thêm ảnh banner để hiển thị slider ở đầu trang chủ."
              />
            ) : (
              <div className="space-y-3 p-4">
                {result.rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center gap-3 rounded-2xl border border-line p-3"
                  >
                    <div className="grid h-16 w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.image_url}
                        alt={row.alt ?? "Slide"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {row.alt || "Ảnh không có mô tả"}
                      </p>
                      <p className="text-xs text-ink/80">
                        #{row.sort_order} · {row.is_active ? "hiển thị" : "ẩn"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <a
                        href={`/admin/slider?edit=${row.id}`}
                        className="grid h-8 w-8 place-items-center rounded-xl border border-line text-ink/55 hover:border-primary hover:text-primary"
                        aria-label="Sửa slide"
                      >
                        <Pencil size={15} />
                      </a>
                      <form action={deleteHeroSlide}>
                        <input type="hidden" name="id" value={row.id} />
                        <ConfirmSubmit confirmText="Xoá slide này khỏi trang chủ?">
                          <Trash2 size={15} />
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {openForm && (
            <Panel className="h-fit">
              <PanelHead
                title={editing ? "Sửa slide" : "Thêm slide"}
                subtitle="Banner nên là ảnh ngang, tỉ lệ khoảng 16:7"
              />
              <SlideForm
                key={editing?.id ?? "new"}
                editing={editing}
                nextOrder={nextOrder}
                count={result.rows.length}
              />
            </Panel>
          )}
        </div>
      )}
    </>
  );
}
