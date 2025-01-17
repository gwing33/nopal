import { parse } from "./parse";

test("parse metadata out of markdown", () => {
  expect(parse(`# Simple Journey`)).toEqual({ id: null, type: null });
  expect(parse(`# Note No.1: Journey`)).toEqual({ id: "1", type: "Note" });
});
