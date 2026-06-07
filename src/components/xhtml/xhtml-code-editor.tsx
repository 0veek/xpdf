"use client";

import CodeMirror from "@uiw/react-codemirror";
import { xml } from "@codemirror/lang-xml";
import { oneDark } from "@codemirror/theme-one-dark";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type XhtmlCodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  readOnly?: boolean;
};

export function XhtmlCodeEditor({
  value,
  onChange,
  className,
  readOnly = false,
}: XhtmlCodeEditorProps) {
  const { resolvedTheme } = useTheme();

  return (
    <CodeMirror
      value={value}
      height="100%"
      className={cn("h-full text-sm [&_.cm-editor]:h-full [&_.cm-scroller]:font-mono", className)}
      theme={resolvedTheme === "dark" ? oneDark : "light"}
      extensions={[xml()]}
      editable={!readOnly}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        bracketMatching: true,
        autocompletion: true,
        highlightActiveLine: true,
        indentOnInput: true,
      }}
      onChange={onChange}
    />
  );
}
