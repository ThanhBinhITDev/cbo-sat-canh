"use client";

import { useState, type ReactNode } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Link2Off,
  ImageIcon,
  Minus,
  Undo2,
  Redo2,
} from "lucide-react";
import { uploadArticleImage, imageUrlFromPaste } from "@/lib/admin/upload-image";
import ImageDialog from "./ImageDialog";

function ToolbarButton({
  title,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-lg transition disabled:opacity-35 ${
        active
          ? "bg-primary text-white"
          : "text-ink/65 hover:bg-white hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  name,
  defaultValue = "",
  placeholder = "Soạn nội dung bài viết…",
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [html, setHtml] = useState(defaultValue);
  const [imageOpen, setImageOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: defaultValue || "",
    editorProps: {
      attributes: { class: "prose-post" },
      handlePaste: (_view, event) => {
        const text = event.clipboardData?.getData("text/plain") ?? "";
        const src = imageUrlFromPaste(text);
        if (!src) return false;
        event.preventDefault();
        editor?.chain().focus().setImage({ src, alt: "" }).run();
        return true;
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) return false;
        const file = event.dataTransfer?.files?.[0];
        if (!file || !file.type.startsWith("image/")) return false;
        event.preventDefault();
        setUploading(true);
        void uploadArticleImage(file)
          .then((src) => editor?.chain().focus().setImage({ src, alt: "" }).run())
          .finally(() => setUploading(false));
        return true;
      },
    },
    onUpdate: ({ editor: e }) => setHtml(e.getHTML()),
  });

  const ui = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) {
        return {
          bold: false,
          italic: false,
          underline: false,
          strike: false,
          h2: false,
          h3: false,
          bullet: false,
          ordered: false,
          blockquote: false,
          alignLeft: false,
          alignCenter: false,
          alignRight: false,
          link: false,
          canUndo: false,
          canRedo: false,
        };
      }
      return {
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        h2: e.isActive("heading", { level: 2 }),
        h3: e.isActive("heading", { level: 3 }),
        bullet: e.isActive("bulletList"),
        ordered: e.isActive("orderedList"),
        blockquote: e.isActive("blockquote"),
        alignLeft: e.isActive({ textAlign: "left" }),
        alignCenter: e.isActive({ textAlign: "center" }),
        alignRight: e.isActive({ textAlign: "right" }),
        link: e.isActive("link"),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      };
    },
  });

  function promptLink() {
    if (!editor) return;
    const prev = (editor.getAttributes("link").href as string | undefined) ?? "https://";
    const input = window.prompt("Nhập đường dẫn liên kết:", prev);
    if (input === null) return;
    const url = input.trim();
    const chain = editor.chain().focus().extendMarkRange("link");
    if (!url) chain.unsetLink().run();
    else chain.setLink({ href: url }).run();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <input type="hidden" name={name} value={html} />

      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-muted p-1.5">
        <ToolbarButton
          title="Đậm"
          active={ui?.bold}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Nghiêng"
          active={ui?.italic}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Gạch chân"
          active={ui?.underline}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Gạch ngang"
          active={ui?.strike}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-line" />

        <ToolbarButton
          title="Tiêu đề lớn (H2)"
          active={ui?.h2}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Tiêu đề nhỏ (H3)"
          active={ui?.h3}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={16} />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-line" />

        <ToolbarButton
          title="Danh sách"
          active={ui?.bullet}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Danh sách số"
          active={ui?.ordered}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Trích dẫn"
          active={ui?.blockquote}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={16} />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-line" />

        <ToolbarButton
          title="Căn trái"
          active={ui?.alignLeft}
          disabled={!editor}
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Căn giữa"
          active={ui?.alignCenter}
          disabled={!editor}
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Căn phải"
          active={ui?.alignRight}
          disabled={!editor}
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight size={16} />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-line" />

        <ToolbarButton
          title="Chèn / sửa liên kết"
          active={ui?.link}
          disabled={!editor}
          onClick={promptLink}
        >
          <LinkIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Bỏ liên kết"
          disabled={!editor || !ui?.link}
          onClick={() => editor?.chain().focus().unsetLink().run()}
        >
          <Link2Off size={16} />
        </ToolbarButton>
        <ToolbarButton title="Chèn ảnh" disabled={!editor} onClick={() => setImageOpen(true)}>
          <ImageIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Đường kẻ ngang"
          disabled={!editor}
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={16} />
        </ToolbarButton>

        <span className="mx-1 h-5 w-px bg-line" />

        <ToolbarButton
          title="Hoàn tác"
          disabled={!editor || !ui?.canUndo}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          title="Làm lại"
          disabled={!editor || !ui?.canRedo}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          <Redo2 size={16} />
        </ToolbarButton>

        {uploading && (
          <span className="ml-auto pr-1 text-xs font-semibold text-primary">Đang tải ảnh…</span>
        )}
      </div>

      <div className="rich-editor cursor-text" onClick={() => editor?.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>

      <ImageDialog
        open={imageOpen}
        title="Chèn ảnh vào bài viết"
        onClose={() => setImageOpen(false)}
        onInsert={(url) => {
          editor?.chain().focus().setImage({ src: url, alt: "" }).run();
          setImageOpen(false);
        }}
      />
    </div>
  );
}
