import "@mdxeditor/editor/style.css";
import "../styles/mdxeditor.css";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
} from "@mdxeditor/editor";

interface MdxEditorClientProps {
  markdown: string;
  onChange: (md: string) => void;
}

export default function MdxEditorClient({
  markdown,
  onChange,
}: MdxEditorClientProps) {
  return (
    <MDXEditor
      markdown={markdown}
      onChange={onChange}
      plugins={[
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
      ]}
    />
  );
}
