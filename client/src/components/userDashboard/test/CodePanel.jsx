"use client";

import Editor from "@monaco-editor/react";
import { useRef, useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Check } from "lucide-react";

// ... (theme definitions remain the same)

export default function CodeEditorPanel({
  code,
  onCodeChange,
  questionTitle,
  questionId,
}) {
  const editorRef = useRef(null);
  const { theme } = useTheme();
  const [fontSize, setFontSize] = useState(14);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved"); // 'saved' | 'unsaved' | 'saving'
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const saveTimeoutRef = useRef(null);
  const [editedCode, setEditedCode] = useState(code); // Initialize with prop

  // Update local state when parent code changes
  useEffect(() => {
    setEditedCode(code);
    setSaveStatus("saved");
  }, [code, questionId]); // Reset status when code or question changes

  const handleEditorChange = (newValue) => {
    setEditedCode(newValue);
    setSaveStatus("unsaved");

    // Debounce the save operation
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saving");
      onCodeChange(newValue);
      setSaveStatus("saved");
      setLastSavedTime(new Date());
    }, 1000); // 1 second debounce
  };

  // Format time for display
  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="border-[1.7px] border-zinc-300 dark:border-zinc-700 rounded-lg dark:bg-black h-full flex flex-col overflow-hidden"
    >
      <div className="sticky top-0 z-10  dark:bg-black px-4 py-1 border-b border-zinc-300 dark:border-zinc-700 flex items-center justify-between">
        <h2 className="text-[15px] font-[450]">&lt;/&gt; Code</h2>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          value={editedCode}
          onChange={handleEditorChange}
          theme={
            isEditorReady
              ? theme === "dark"
                ? "custom-dark"
                : "custom-light"
              : "vs"
          }
          options={{
            fontFamily: "'Source Code Pro', monospace",
            fontSize: fontSize,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            padding: { top: 8 },
            lineNumbersMinChars: 3,
            contextmenu: false,
          }}
        />
      </div>

      {/* Enhanced footer with save status */}
      <div
        className={`
        sticky bottom-0 z-10 px-4 py-2 border-t 
        ${
          saveStatus === "saved"
            ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 border-green-200 dark:border-green-800"
            : ""
        }
        ${
          saveStatus === "unsaved"
            ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
            : ""
        }
        ${
          saveStatus === "saving"
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800"
            : ""
        }
        flex justify-between items-center text-sm
      `}
      >
        <div>
          {saveStatus === "saved" && (
            <span className="flex items-center">
              <Check className="w-6 h-6" />
              Saved
            </span>
          )}
          {saveStatus === "unsaved" && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              Unsaved changes
            </span>
          )}
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Saving...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
