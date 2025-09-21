// components/RichTextEditor.jsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useState, useEffect } from "react";
import {
  BoldIcon,
  ItalicIcon,
  ListOrdered,
  ListIcon,
  Link2,
} from "lucide-react";

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  const buttons = [
    {
      Icon: BoldIcon,
      isActive: editor.isActive("bold"),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      Icon: ItalicIcon,
      isActive: editor.isActive("italic"),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      Icon: ListIcon,
      isActive: editor.isActive("bulletList"),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      Icon: ListOrdered,
      isActive: editor.isActive("orderedList"),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      Icon: Link2,
      isActive: editor.isActive("link"),
      onClick: () => {
        const url = prompt("Enter link:");
        if (url) editor.chain().focus().setLink({ href: url }).run();
      },
    },
  ];

  return (
    <div className="flex items-center gap-0 mb-4 border-b pb-3">
      {buttons.map((btn, index) => (
        <div key={index} className="flex items-center">
          <EditorButton
            Icon={btn.Icon}
            isActive={btn.isActive}
            onClick={btn.onClick}
          />
          {/* Add margin between buttons except after the last one */}
          {index !== buttons.length - 1 && (
            <div className="w-[1px] h-6 bg-gray-300 mx-2"></div>
          )}
        </div>
      ))}
    </div>
  );
};

const EditorButton = ({ isActive, onClick, Icon }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
        isActive ? "bg-gray-100 text-gray-900" : "text-gray-600"
      }`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
};

export default function RichTextEditor({ value, onChange }) {
  const [mounted, setMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="border-gray-200 border-[1.6px] rounded-lg p-4">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="min-h-[100px] p-2" />
    </div>
  );
}
