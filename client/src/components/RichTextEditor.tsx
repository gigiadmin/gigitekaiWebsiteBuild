/**
 * RichTextEditor — TipTap-powered WYSIWYG editor for blog content
 * Toolbar: Bold, Italic, Underline, Strikethrough, H1/H2/H3,
 *          Bullet list, Ordered list, Blockquote, Code block,
 *          Link, Image insert, Video embed (YouTube/Vimeo), Align, Undo/Redo
 */

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Youtube from "@tiptap/extension-youtube";
import { createLowlight } from "lowlight";
import js from "highlight.js/lib/languages/javascript";
import ts from "highlight.js/lib/languages/typescript";
import bash from "highlight.js/lib/languages/bash";
import { useCallback, useEffect, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code2, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2, ImageIcon, Minus, Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// ─── lowlight setup ──────────────────────────────────────────────────────────
const lowlight = createLowlight();
lowlight.register("javascript", js);
lowlight.register("typescript", ts);
lowlight.register("bash", bash);

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalise a YouTube or Vimeo URL into an embeddable form.
 * TipTap's Youtube extension accepts standard watch/share/embed URLs.
 * For Vimeo we convert to the embed URL ourselves.
 */
function normaliseVideoUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;

  // Vimeo: https://vimeo.com/123456789 → https://player.vimeo.com/video/123456789
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // YouTube — TipTap handles all standard forms natively
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return url;
  }

  return null;
}

// ─── types ───────────────────────────────────────────────────────────────────
interface RichTextEditorProps {
  value: string;           // HTML string
  onChange: (html: string) => void;
  onImageInsert?: () => void; // called when user clicks the image toolbar button
  placeholder?: string;
  minHeight?: string;
}

// ─── toolbar button ──────────────────────────────────────────────────────────
function ToolBtn({
  onClick,
  active,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-[#00D4FF] text-[#0A0E1A]"
          : "text-gray-400 hover:text-white hover:bg-white/10"
      } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

// ─── component ───────────────────────────────────────────────────────────────
export default function RichTextEditor({
  value,
  onChange,
  onImageInsert,
  placeholder = "Write your article here…",
  minHeight = "400px",
}: RichTextEditorProps) {
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // replaced by CodeBlockLowlight
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-[#00D4FF] underline" },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CodeBlockLowlight.configure({ lowlight }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        width: 640,
        height: 360,
        HTMLAttributes: {
          class: "rounded-xl overflow-hidden my-4 w-full aspect-video",
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-sm max-w-none focus:outline-none p-4",
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Sync external value changes (e.g. when editing an existing post)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Enter URL", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  function openVideoDialog() {
    setVideoUrl("");
    setVideoError("");
    setVideoDialogOpen(true);
  }

  function insertVideo() {
    const normalised = normaliseVideoUrl(videoUrl);
    if (!normalised) {
      setVideoError("Please enter a valid YouTube or Vimeo URL.");
      return;
    }
    if (!editor) return;

    // Vimeo: insert as a responsive iframe node via HTML
    if (normalised.includes("player.vimeo.com")) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<div class="video-embed-wrapper"><iframe src="${normalised}" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="rounded-xl w-full aspect-video"></iframe></div>`
        )
        .run();
    } else {
      // YouTube: use the built-in extension
      editor.chain().focus().setYoutubeVideo({ src: normalised }).run();
    }

    setVideoDialogOpen(false);
    setVideoUrl("");
    setVideoError("");
  }

  if (!editor) return null;

  return (
    <>
      <div className="rounded-xl border border-[rgba(0,212,255,0.2)] bg-[#0A0E1A] overflow-hidden">
        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[rgba(0,212,255,0.15)] bg-[#141B2D]">
          {/* History */}
          <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo2 size={15} />
          </ToolBtn>
          <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo2 size={15} />
          </ToolBtn>

          <div className="w-px h-5 bg-gray-700 mx-1" />

          {/* Headings */}
          <ToolBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 size={15} />
          </ToolBtn>
          <ToolBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 size={15} />
          </ToolBtn>
          <ToolBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 size={15} />
          </ToolBtn>

          <div className="w-px h-5 bg-gray-700 mx-1" />

          {/* Inline marks */}
          <ToolBtn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold size={15} />
          </ToolBtn>
          <ToolBtn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic size={15} />
          </ToolBtn>
          <ToolBtn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon size={15} />
          </ToolBtn>
          <ToolBtn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough size={15} />
          </ToolBtn>

          <div className="w-px h-5 bg-gray-700 mx-1" />

          {/* Lists */}
          <ToolBtn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List size={15} />
          </ToolBtn>
          <ToolBtn title="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered size={15} />
          </ToolBtn>

          <div className="w-px h-5 bg-gray-700 mx-1" />

          {/* Blocks */}
          <ToolBtn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote size={15} />
          </ToolBtn>
          <ToolBtn title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <Code2 size={15} />
          </ToolBtn>
          <ToolBtn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus size={15} />
          </ToolBtn>

          <div className="w-px h-5 bg-gray-700 mx-1" />

          {/* Alignment */}
          <ToolBtn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            <AlignLeft size={15} />
          </ToolBtn>
          <ToolBtn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            <AlignCenter size={15} />
          </ToolBtn>
          <ToolBtn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            <AlignRight size={15} />
          </ToolBtn>

          <div className="w-px h-5 bg-gray-700 mx-1" />

          {/* Link */}
          <ToolBtn title="Insert / edit link" active={editor.isActive("link")} onClick={setLink}>
            <LinkIcon size={15} />
          </ToolBtn>

          {/* Image insert via uploader */}
          {onImageInsert && (
            <ToolBtn title="Insert image" onClick={onImageInsert}>
              <ImageIcon size={15} />
            </ToolBtn>
          )}

          {/* Video embed — YouTube or Vimeo */}
          <ToolBtn title="Embed YouTube / Vimeo video" onClick={openVideoDialog}>
            <Video size={15} />
          </ToolBtn>
        </div>

        {/* ── Editor area ──────────────────────────────────────────────────── */}
        <EditorContent editor={editor} />
      </div>

      {/* ── Video embed dialog ───────────────────────────────────────────── */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="bg-[#141B2D] border-[rgba(0,212,255,0.2)] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Video size={18} className="text-[#00D4FF]" />
              Embed Video
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <p className="text-sm text-gray-400">
              Paste a YouTube or Vimeo URL to embed a responsive video player in your article.
            </p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Video URL</label>
              <Input
                value={videoUrl}
                onChange={(e) => { setVideoUrl(e.target.value); setVideoError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertVideo(); } }}
                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                className="bg-[#0A0E1A] border-[rgba(0,212,255,0.2)] text-white placeholder:text-gray-600 font-mono text-sm"
                autoFocus
              />
              {videoError && (
                <p className="text-xs text-red-400 mt-1">{videoError}</p>
              )}
            </div>
            <div className="text-xs text-gray-600 space-y-0.5">
              <p>Supported formats:</p>
              <p className="font-mono">youtube.com/watch?v=… · youtu.be/… · vimeo.com/…</p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setVideoDialogOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={insertVideo}
              className="bg-[#00D4FF] text-[#0A0E1A] hover:bg-[#00B8E0] font-semibold"
            >
              Embed Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Insert an image URL into the editor programmatically.
 * Call this after the user picks an image from the uploader.
 */
export function insertImageIntoEditor(
  editorRef: ReturnType<typeof useEditor>,
  url: string
) {
  editorRef?.chain().focus().setImage({ src: url }).run();
}
