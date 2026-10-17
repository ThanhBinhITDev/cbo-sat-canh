"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Trash2,
  Recycle,
  FileText,
  ExternalLink,
  AlertTriangle,
  X,
  FolderOpen,
} from "lucide-react";
import { EmptyState, Panel, PanelHead } from "@/components/admin/ui";
import { confirmDialog } from "@/lib/swal";
import { submitWithToast } from "@/lib/admin/submit-with-toast";
import { deleteStorageFiles } from "@/lib/admin/actions";
import { formatBytes, formatDate } from "@/lib/format";
import type { StorageFile } from "@/lib/admin/storage";

type SortKey = "new" | "old" | "name" | "size";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "new", label: "Mới nhất" },
  { value: "old", label: "Cũ nhất" },
  { value: "name", label: "Tên A → Z" },
  { value: "size", label: "Nặng nhất" },
];

function isImage(file: StorageFile) {
  return Boolean(file.mime?.startsWith("image/"));
}

export default function StorageBrowser({ files }: { files: StorageFile[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("new");
  const [sel, setSel] = useState<string | null>(null);

  const folders = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of files) m.set(f.folder, (m.get(f.folder) ?? 0) + 1);
    return [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [files]);

  const orphanCount = files.filter((f) => !f.used).length;
  const orphanBytes = files
    .filter((f) => !f.used)
    .reduce((s, f) => s + f.size, 0);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = files.filter((f) => {
      if (tab === "orphan" && f.used) return false;
      if (tab !== "all" && tab !== "orphan" && f.folder !== tab) return false;
      if (needle && !f.path.toLowerCase().includes(needle)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "size") return b.size - a.size;
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return sort === "old" ? ta - tb : tb - ta;
    });
  }, [files, q, tab, sort]);

  const current = sel ? (files.find((f) => f.path === sel) ?? null) : null;

  async function removePaths(paths: string[], force: boolean) {
    if (!paths.length || pending) return;
    const fd = new FormData();
    fd.set("paths", paths.join("\n"));
    if (force) fd.set("force", "1");
    const state = await submitWithToast(fd, deleteStorageFiles, {
      loading: "Đang xoá tệp...",
    });
    if (state.ok) {
      setSel(null);
      startTransition(() => router.refresh());
    }
  }

  async function deleteOne(file: StorageFile) {
    const ok = await confirmDialog({
      title: "Xoá tệp",
      text: file.used
        ? `Tệp đang được dùng ở ${file.usage.length} nơi. Xoá sẽ làm hỏng liên kết ở đó. Vẫn xoá "${file.name}"?`
        : `Xoá "${file.name}" khỏi kho lưu trữ? Thao tác không thể hoàn tác.`,
      confirmButtonText: file.used ? "Vẫn xoá" : "Xoá tệp",
      isDanger: true,
    });
    if (ok) await removePaths([file.path], file.used);
  }

  async function cleanOrphans() {
    const orphans = files.filter((f) => !f.used);
    if (!orphans.length) return;
    const ok = await confirmDialog({
      title: "Dọn tệp mồ côi",
      text: `Xoá ${orphans.length} tệp không còn nơi nào dùng (${formatBytes(
        orphanBytes,
      )})? Thao tác không thể hoàn tác.`,
      confirmButtonText: `Xoá ${orphans.length} tệp`,
      isDanger: true,
    });
    if (ok) await removePaths(orphans.map((o) => o.path), false);
  }

  const chipBase =
    "rounded-xl px-3.5 py-1.5 text-sm font-bold transition whitespace-nowrap";
  const chipOn = "bg-primary text-white";
  const chipOff =
    "border border-line bg-white text-ink/85 hover:border-primary hover:text-primary";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Panel className="@container">
        <PanelHead
          title="Tệp trong kho"
          subtitle={`${rows.length} / ${files.length} tệp`}
          action={
            orphanCount > 0 ? (
              <button
                type="button"
                onClick={cleanOrphans}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-50"
              >
                <Recycle size={15} /> Dọn {orphanCount} ảnh mồ côi
              </button>
            ) : undefined
          }
        />

        <div className="space-y-3 border-b border-line p-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/50"
              />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên tệp..."
                className="input pl-9"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="select w-auto"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTab("all")}
              className={`${chipBase} ${tab === "all" ? chipOn : chipOff}`}
            >
              Tất cả
              <span className="ml-1.5 opacity-70">{files.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("orphan")}
              className={`${chipBase} ${tab === "orphan" ? chipOn : chipOff}`}
            >
              Mồ côi
              <span className="ml-1.5 opacity-70">{orphanCount}</span>
            </button>
            {folders.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => setTab(f.name)}
                className={`${chipBase} ${tab === f.name ? chipOn : chipOff}`}
              >
                {f.name}
                <span className="ml-1.5 opacity-70">{f.count}</span>
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="Không có tệp nào khớp"
            description="Thử xoá từ khoá tìm kiếm hoặc chọn bộ lọc khác."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-admin table-fixed">
              <thead>
                <tr>
                  <th>Tệp</th>
                  <th className="hidden @md:table-cell w-24">Dung lượng</th>
                  <th className="hidden @xl:table-cell w-28">Thư mục</th>
                  <th className="hidden @4xl:table-cell w-32">Ngày tải</th>
                  <th className="w-28">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((file) => {
                  const active = file.path === sel;
                  return (
                    <tr
                      key={file.path}
                      onClick={() => setSel(file.path)}
                      className={`cursor-pointer ${active ? "bg-primary/10" : ""}`}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          {isImage(file) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={file.publicUrl}
                              alt=""
                              loading="lazy"
                              className="h-9 w-9 shrink-0 rounded-lg border border-line object-cover"
                            />
                          ) : (
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted text-ink/60">
                              <FileText size={16} />
                            </span>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">{file.name}</p>
                            <p className="truncate text-xs text-ink/80">{file.path}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden @md:table-cell text-sm text-ink/85">
                        {formatBytes(file.size)}
                      </td>
                      <td className="hidden @xl:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-sm text-ink/85">
                          <FolderOpen size={14} className="text-ink/50" />
                          {file.folder}
                        </span>
                      </td>
                      <td className="hidden @4xl:table-cell text-sm text-ink/85">
                        {formatDate(file.createdAt)}
                      </td>
                      <td>
                        {file.used ? (
                          <span className="badge badge-green">Đang dùng</span>
                        ) : (
                          <span className="badge badge-yellow">Mồ côi</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel className="h-fit lg:sticky lg:top-4">
        <PanelHead
          title="Chi tiết tệp"
          subtitle={current ? current.name : "Chọn một tệp trong bảng"}
          action={
            current ? (
              <button
                type="button"
                onClick={() => setSel(null)}
                aria-label="Đóng chi tiết"
                className="grid h-8 w-8 place-items-center rounded-xl border border-line text-ink/60 hover:border-primary hover:text-primary"
              >
                <X size={15} />
              </button>
            ) : undefined
          }
        />
        {!current ? (
          <EmptyState
            title="Chưa chọn tệp"
            description="Bấm vào một dòng trong bảng để xem nơi đang dùng và xoá tệp."
          />
        ) : (
          <div className="space-y-4 p-5">
            <div className="grid place-items-center overflow-hidden rounded-xl border border-line bg-muted">
              {isImage(current) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.publicUrl}
                  alt=""
                  className="max-h-56 w-full object-contain"
                />
              ) : (
                <span className="py-10 text-ink/50">
                  <FileText size={40} />
                </span>
              )}
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-ink/70">Dung lượng</dt>
                <dd className="text-right font-semibold">{formatBytes(current.size)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-ink/70">Định dạng</dt>
                <dd className="text-right font-semibold">{current.mime ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="shrink-0 text-ink/70">Ngày tải</dt>
                <dd className="text-right font-semibold">
                  {formatDate(current.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-ink/70">Đường dẫn</dt>
                <dd className="mt-1 break-all rounded-lg bg-muted px-3 py-2 text-xs font-medium text-ink/85">
                  {current.path}
                </dd>
              </div>
            </dl>

            <div>
              <p className="text-xs font-black uppercase tracking-wide text-ink/60">
                Nơi đang dùng
              </p>
              {current.used ? (
                <ul className="mt-2 space-y-1.5">
                  {current.usage.map((u, i) => (
                    <li key={`${u.label}-${i}`}>
                      {u.href ? (
                        <a
                          href={u.href}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-dark hover:underline"
                        >
                          <ExternalLink size={13} /> {u.label}
                        </a>
                      ) : (
                        <span className="text-sm font-semibold text-ink/85">
                          {u.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-ink/80">
                  Không nơi nào dùng — đây là tệp mồ côi, xoá an toàn.
                </p>
              )}
            </div>

            {current.used && (
              <p className="t-note text-sm">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
                Xoá tệp này sẽ làm hỏng liên kết ở {current.usage.length} nơi đang
                dùng. Chỉ xoá khi bạn đã thay ảnh mới ở đó.
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => deleteOne(current)}
                disabled={pending}
                className="btn inline-flex flex-1 items-center justify-center gap-1.5 border border-red-200 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={16} /> {current.used ? "Vẫn xoá" : "Xoá tệp"}
              </button>
              <a
                href={current.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost px-4 py-2.5 text-sm"
              >
                <ExternalLink size={16} /> Mở
              </a>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
