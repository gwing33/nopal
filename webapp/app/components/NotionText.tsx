import type { RichTextItemResponse } from "@notionhq/client/build/src/api-endpoints";

export function getPlainText(text: RichTextItemResponse[]): string {
  return text.map((t) => t.plain_text).join(" ");
}

export function NotionText({ text }: { text?: RichTextItemResponse[] }) {
  if (!text) {
    return null;
  }
  return (
    <>
      {text.map((t: any, i) => {
        switch (t.type) {
          case "text":
            const classNames = getTextClasses(t, "text-xl");
            return (
              <span key={i} className={classNames}>
                {t.plain_text}
              </span>
            );
          case "mention":
            if (t.mention.type == "page") {
              const classNames = getTextClasses(t, "link text-xl");
              return (
                <a key={i} className={classNames} href={t.href}>
                  {t.plain_text}
                </a>
              );
            }
        }
        console.warn("Unsupported Text");
        console.log({ text: t });
        return null;
      })}
    </>
  );
}

function getTextClasses(text: any, append: string = "") {
  return Object.entries(text.annotations).reduce((acc, [k, v]) => {
    if (!v) {
      return acc;
    }
    switch (k) {
      case "bold":
        return acc + "font-bold ";
      case "italic":
        return acc + "italic ";
      case "strikethrough":
        return acc + "strikethrough ";
      case "underline":
        return acc + "underline ";
    }
    return acc;
  }, append + " ");
}
