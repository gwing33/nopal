export function NotionText({ text }: { text: Object[] }) {
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
              <p className={classNames} key={i}>
                {t.plain_text}
              </p>
            );
        }
        return null;
      })}
    </>
  );
}
