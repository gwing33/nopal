import showdown from "showdown";
import { useMemo } from "react";

showdown.extension("nopal", () => {
  return [
    {
      type: "lang",
      // Regex that matches strikethrough markdown with [] after the closing ~~
      // e.g. ~~strikethrough~~[text] becomes <del>strikethrough<span>text</span</del>
      regex: /~~(.*?)~~\[(.*?)\]/g,
      replace: "<del class='uncooked-thought'>$1<span>$2</span></del>",
    },
  ];
});

export function useMarkdown(body: string) {
  const bodyHtml = useMemo(() => {
    const converter = new showdown.Converter({
      extensions: ["nopal"],
      strikethrough: true,
    });
    return converter.makeHtml(body);
  }, [body]);
  return (
    <div
      className="uncooked-markdown"
      dangerouslySetInnerHTML={{ __html: bodyHtml }}
    />
  );
}
