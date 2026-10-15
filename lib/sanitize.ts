import sanitizeHtml from "sanitize-html";

/**
 * Làm sạch HTML do trình soạn thảo tạo ra trước khi lưu vào `posts.content_html`.
 * Chỉ giữ các thẻ/định dạng an toàn; cho phép căn lề qua inline style text-align.
 */
export function cleanPostHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      "p",
      "br",
      "h2",
      "h3",
      "h4",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "strike",
      "a",
      "ul",
      "ol",
      "li",
      "blockquote",
      "img",
      "hr",
      "figure",
      "figcaption",
      "code",
      "pre",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "title"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      "*": ["style"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const external = /^https?:/i.test(href);
        return {
          tagName,
          attribs: external
            ? { ...attribs, target: "_blank", rel: "noopener noreferrer nofollow" }
            : attribs,
        };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy" },
      }),
    },
    disallowedTagsMode: "discard",
  });
}

/** Lấy phần văn bản để kiểm tra nội dung có rỗng hay không. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
