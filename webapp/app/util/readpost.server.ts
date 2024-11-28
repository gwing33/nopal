import fs from "fs/promises";

export async function readPost(fileName: string) {
  const file = await fs.readFile(`./app/articles/${fileName}`);
  return file.toString();
}
