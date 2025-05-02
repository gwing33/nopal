import type { RichText } from "../data/notion.server";

export function getPlainText(text: RichText[]): string {
  return text.map((t) => t.plain_text).join(" ");
}

export function NotionText({ text }: { text?: RichText[] }) {
  if (!text) {
    return null;
  }
  return (
    <>
      {text.map((t: any, i) => {
        switch (t.type) {
          case "text":
            const classNames = Object.entries(t.annotations).reduce(
              (acc, [k, v]) => {
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
              },
              "text-xl "
            );
            return (
              <span className={classNames} key={i}>
                {t.plain_text}
              </span>
            );
        }
        return null;
      })}
    </>
  );
}
