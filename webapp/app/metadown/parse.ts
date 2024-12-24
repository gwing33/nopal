type TitleMeta = {
  id?: string | null;
  type?: string | null;
};

type Metadown = TitleMeta & {};

export function parse(md: string): Metadown {
  const title: TitleMeta = md
    .split("\n")
    .reduce((acc: null | TitleMeta, line) => {
      if (acc || line.charAt(0) !== "#" || !line.includes("No.")) {
        return acc;
      }
      const matches = /^#+\s*([^0-9]+)\s*No\.(\d+)/.exec(line);
      const id = matches?.[2];
      const type = matches?.[1];
      if (!id || !type) {
        return acc;
      }
      return { id, type: type.trim() };
    }, null) || { id: null, type: null };

  return { ...title } as Metadown;
}
