"use client";

import { useState } from "react";
import {
  BlockTypeSelect, BoldItalicUnderlineToggles, CreateLink, ListsToggle, MDXEditor, UndoRedo,
  headingsPlugin, linkDialogPlugin, linkPlugin, listsPlugin, markdownShortcutPlugin,
  quotePlugin, thematicBreakPlugin, toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { Button } from "@/components/ui/button";
import { contentLink } from "@/lib/dashboard/draft";

const plugins = [
  headingsPlugin(), listsPlugin(), quotePlugin(), thematicBreakPlugin(),
  linkPlugin({ validateUrl: (url) => Boolean(contentLink(url)) }), linkDialogPlugin(), markdownShortcutPlugin(),
  toolbarPlugin({ toolbarContents: () => <><UndoRedo /><BlockTypeSelect /><BoldItalicUnderlineToggles options={["Bold", "Italic"]} /><ListsToggle /><CreateLink /></> }),
];

export default function MarkdownInspector({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [source, setSource] = useState(false);
  const [error, setError] = useState(false);
  const [tooLong, setTooLong] = useState(false);
  const [visualValue, setVisualValue] = useState(value);

  function switchMode(next: boolean) {
    setVisualValue(value);
    setError(false);
    setTooLong(false);
    setSource(next);
  }

  return (
    <div className="grid min-w-0 gap-2">
      <div className="flex gap-1" aria-label="Markdown mode" role="group">
        <Button type="button" variant="outline" size="sm" aria-pressed={!source} onClick={() => switchMode(false)}>Visual</Button>
        <Button type="button" variant="outline" size="sm" aria-pressed={source} onClick={() => switchMode(true)}>Source</Button>
      </div>
      {source
        ? <textarea aria-label="Markdown source" className="dashboard-input" rows={8} value={value} maxLength={12000}
            onChange={(event) => onChange(event.target.value)} />
        : <MDXEditor className="dark-theme taplify-markdown" contentEditableClassName="taplify-markdown-content"
            markdown={visualValue} plugins={plugins} suppressHtmlProcessing onError={() => setError(true)}
            onChange={(next, initialNormalization) => {
              if (initialNormalization) return;
              setTooLong(next.length > 12000);
              onChange(next);
            }} placeholder="Write something for your visitors…" />}
      {error && <p role="alert" className="text-sm text-danger">Open Source to edit Markdown that the visual editor cannot load.</p>}
      {tooLong && <p role="alert" className="text-sm text-danger">Use up to 12,000 characters.</p>}
    </div>
  );
}
