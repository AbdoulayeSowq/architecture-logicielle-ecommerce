import React from "react";
import Editor from "@monaco-editor/react";
import { useTheme } from "../../services/ThemeContext";

const LANG_MAP: Record<string, string> = {
  python: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
  javascript: "javascript",
  typescript: "typescript",
  csharp: "csharp",
  go: "go",
  php: "php",
  dart: "dart",
};

interface Props {
  value: string;
  onChange: (value: string) => void;
  language: string;
  height?: string;
  readOnly?: boolean;
}

const CodeEditor: React.FC<Props> = ({
  value,
  onChange,
  language,
  height = "100%",
  readOnly = false,
}) => {
  const { theme } = useTheme();
  const monacoLang = LANG_MAP[language] || "python";

  return (
    <Editor
      height={height}
      language={monacoLang}
      value={value}
      theme={theme === "dark" ? "vs-dark" : "light"}
      onChange={(v) => onChange(v ?? "")}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
        fontLigatures: true,
        readOnly,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        lineNumbers: "on",
        renderLineHighlight: "line",
        cursorBlinking: "smooth",
        smoothScrolling: true,
        tabSize: 4,
        wordWrap: "off",
        padding: { top: 12, bottom: 12 },
      }}
    />
  );
};

export default CodeEditor;
