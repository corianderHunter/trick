"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

const ToolbarButton = ({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`rounded p-1.5 transition-colors hover:bg-stone-100 dark:hover:bg-stone-700 ${active ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" : "text-stone-600 dark:text-stone-400"
      }`}
  >
    {children}
  </button>
);

const RichTextEditor = ({
  content = "",
  placeholder = "在此输入或粘贴您的文本...",
  onChange,
  onBlur,
  className = "",
  rightLabel,
}: {
  content?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  onBlur?: () => void;
  className?: string;
  /** 显示在编辑器内部顶部、字数左侧（如时间段 "00:00 – 00:15"） */
  rightLabel?: string;
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none min-h-[280px] px-4 py-4 focus:outline-none",
      },
    },
    onBlur: () => {
      onBlur?.();
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  const [charCount, setCharCount] = useState(0);
  useEffect(() => {
    if (!editor) return;
    setCharCount(editor.getText().length);
    const handler = () => setCharCount(editor.getText().length);
    editor.on("update", handler);
    return () => editor.off("update", handler);
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 dark:border-stone-700 dark:bg-stone-900 ${className}`}
    >
      {/* 简洁工具栏 + 顶部右侧字数 */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-0.5 border-b border-stone-100 bg-stone-50/80 px-2 py-1.5 dark:border-stone-700 dark:bg-stone-800/50">
        <div className="flex flex-wrap gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="加粗 (Ctrl+B)"
          >
            <BoldIcon />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="斜体 (Ctrl+I)"
          >
            <ItalicIcon />
          </ToolbarButton>
          <span className="mx-1 w-px self-center bg-stone-200 dark:bg-stone-600" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            title="标题 1"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="标题 2"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="标题 3"
          >
            H3
          </ToolbarButton>
          <span className="mx-1 w-px self-center bg-stone-200 dark:bg-stone-600" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="无序列表"
          >
            <ListIcon />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="有序列表"
          >
            <OrderedListIcon />
          </ToolbarButton>
        </div>
        <div className="flex shrink-0 items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
          {rightLabel != null && rightLabel !== "" && (
            <span title="时间段">{rightLabel}</span>
          )}
          <span title="字数">{charCount} 字</span>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

function BoldIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 18h2v-2H3v2zm0-5h2v-2H3v2zm0-7v2h2V6H3zm18.5 12.5L20 19l-1.5-1.5v-2.5l-1.5-1.5v-2.5L20 10l1.5 1.5v2.5l1.5 1.5v2.5zM11 18h8v-2h-8v2zm0-5h8v-2h-11v2zm0-4v2h8V7h-8z" />
    </svg>
  );
}

function OrderedListIcon() {
  return (
    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
    </svg>
  );
}

export default RichTextEditor;
