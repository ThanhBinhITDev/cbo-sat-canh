"use client";

import { useState } from "react";
import {
  Check,
  Play,
  Send,
  CheckCheck,
  RotateCcw,
  XCircle,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { submitWithToast } from "@/lib/admin/submit-with-toast";
import { transitionTask } from "@/lib/admin/collab-actions";
import { NEXT_ACTIONS } from "@/lib/collab";
import type { TaskStatus } from "@/lib/types";

type Panel = "submit" | "revise" | "cancel" | "comment" | null;

export default function TaskActions({
  taskId,
  status,
  isAssignee,
  isManager,
}: {
  taskId: string;
  status: TaskStatus;
  isAssignee: boolean;
  isManager: boolean;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [url, setUrl] = useState("");

  const assigneeActions = isAssignee
    ? NEXT_ACTIONS[status].filter((a) => ["accept", "progress", "submit"].includes(a))
    : [];
  const canApprove = isManager && status === "submitted";
  const canCancel = isManager && status !== "completed" && status !== "cancelled";

  const run = (
    action: string,
    loading: string,
    extra?: { note?: string; url?: string },
  ) => {
    const fd = new FormData();
    fd.set("task", taskId);
    fd.set("action", action);
    if (extra?.note) fd.set("note", extra.note);
    if (extra?.url) fd.set("url", extra.url);
    setBusy(true);
    void submitWithToast(fd, transitionTask, { loading }).finally(() => {
      setBusy(false);
      setPanel(null);
      setNote("");
      setUrl("");
    });
  };

  const btn =
    "inline-flex items-center gap-2 rounded-xl border border-line px-3.5 py-2 text-sm font-semibold transition disabled:opacity-50";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {assigneeActions.includes("accept") && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run("accept", "Đang nhận nhiệm vụ...")}
            className={`${btn} border-primary text-primary hover:bg-primary/5`}
          >
            <Check size={16} /> Nhận nhiệm vụ
          </button>
        )}
        {assigneeActions.includes("progress") && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run("progress", "Đang cập nhật tiến độ...")}
            className={`${btn} text-ink/70 hover:border-primary hover:text-primary`}
          >
            <Play size={16} /> Bắt đầu / cập nhật tiến độ
          </button>
        )}
        {assigneeActions.includes("submit") && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setPanel(panel === "submit" ? null : "submit")}
            className={`${btn} border-primary bg-primary text-white hover:opacity-90`}
          >
            <Send size={16} /> Gửi kết quả
          </button>
        )}
        {canApprove && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => run("approve", "Đang duyệt nhiệm vụ...")}
              className={`${btn} border-emerald-500 text-emerald-600 hover:bg-emerald-50`}
            >
              <CheckCheck size={16} /> Duyệt hoàn thành
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPanel(panel === "revise" ? null : "revise")}
              className={`${btn} text-ink/70 hover:border-amber-500 hover:text-amber-600`}
            >
              <RotateCcw size={16} /> Yêu cầu chỉnh sửa
            </button>
          </>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => setPanel(panel === "comment" ? null : "comment")}
          className={`${btn} text-ink/70 hover:border-primary hover:text-primary`}
        >
          <MessageSquare size={16} /> Bình luận
        </button>
        {canCancel && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setPanel(panel === "cancel" ? null : "cancel")}
            className={`${btn} t-danger`}
          >
            <XCircle size={16} /> Huỷ
          </button>
        )}
        {busy && <Loader2 size={16} className="animate-spin text-primary" />}
      </div>

      {panel && (
        <div className="rounded-xl border border-line bg-muted/40 p-4">
          {panel === "comment" && (
            <>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Viết bình luận hoặc trao đổi…"
                className="input"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost px-4 py-2 text-sm"
                  onClick={() => setPanel(null)}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={busy || !note.trim()}
                  className="btn btn-primary px-4 py-2 text-sm"
                  onClick={() => run("comment", "Đang gửi bình luận...", { note })}
                >
                  Gửi bình luận
                </button>
              </div>
            </>
          )}

          {panel === "submit" && (
            <>
              <label className="field-label">Mô tả kết quả</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Tóm tắt kết quả đã thực hiện…"
                className="input"
              />
              <label className="field-label mt-3 block">Đường dẫn kết quả (tuỳ chọn)</label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://… (ảnh, tài liệu, bài viết…)"
                className="input"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost px-4 py-2 text-sm"
                  onClick={() => setPanel(null)}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={busy || !note.trim()}
                  className="btn btn-primary px-4 py-2 text-sm"
                  onClick={() => run("submit", "Đang gửi kết quả...", { note, url })}
                >
                  Gửi kết quả
                </button>
              </div>
            </>
          )}

          {panel === "revise" && (
            <>
              <label className="field-label">Nội dung cần chỉnh sửa</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Nêu rõ phần cần sửa…"
                className="input"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost px-4 py-2 text-sm"
                  onClick={() => setPanel(null)}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={busy || !note.trim()}
                  className="btn btn-primary px-4 py-2 text-sm"
                  onClick={() => run("request_revision", "Đang gửi yêu cầu...", { note })}
                >
                  Gửi yêu cầu
                </button>
              </div>
            </>
          )}

          {panel === "cancel" && (
            <>
              <label className="field-label">Lý do huỷ (tuỳ chọn)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="input"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost px-4 py-2 text-sm"
                  onClick={() => setPanel(null)}
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="btn btn-primary px-4 py-2 text-sm"
                  onClick={() => run("cancel", "Đang huỷ nhiệm vụ...", { note })}
                >
                  Xác nhận huỷ
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
