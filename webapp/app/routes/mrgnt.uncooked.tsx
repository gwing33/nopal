import { useState } from "react";
import { Input } from "../components/Input";
import { Autocomplete } from "../components/Autocomplete";
import { redirect, ActionFunctionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";

let _uniqueId = 0;
function uniqueId(prefix: string = "") {
  _uniqueId++;
  return prefix + uniqueId;
}

const types = [
  "newspaper-clipping",
  "print",
  "betamax",
  "view-master-reel",
  "presentation",
];

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
  console.log(body);
  return redirect("/mrgnt");
}

export default function MrgntUncookedManage() {
  const [data, setData] = useState({
    type: "",
    author: "",
    title: "",
    body: "",
    images: [{ id: uniqueId("image"), value: "" }],
    externalUrl: "",
  });

  return (
    <div>
      <h1 className="font-bold mb-4"># New Uncooked Thought</h1>
      <Form method="post" className="w-72 flex flex-col gap-4">
        <Autocomplete
          label="Type"
          name="type"
          value={data.type}
          onChange={(type) => setData({ ...data, type })}
          options={types}
        />
        <Autocomplete
          label="Author"
          name="author"
          value={data.author}
          onChange={(author) => setData({ ...data, author })}
          options={["Austin", "Gerald", "James"]}
        />
        <Input
          label="Title"
          name="title"
          value={data.title}
          onChange={(e) => setData({ ...data, title: e.target.value })}
        />
        <Input
          label="Markdown Body"
          name="body"
          type="textarea"
          value={data.body}
          onChange={(e) => setData({ ...data, body: e.target.value })}
        />
        <div>
          {data.images.map((image, i) => (
            <div className={i > 0 ? "mt-4" : ""}>
              <Input
                key={image.id}
                label={
                  "Image " +
                  (i > 0
                    ? Array.from(Array(i).keys()).reduce(
                        (acc) => acc + "o",
                        "To"
                      )
                    : "")
                }
                name="image"
                value={image.value}
                onChange={(e) => {
                  const newImgs = [...data.images].map((i) => {
                    return i.id == image.id
                      ? { id: image.id, value: e.target.value }
                      : i;
                  });
                  setData({ ...data, images: newImgs });
                }}
              />
            </div>
          ))}
          {data.images.length < 4 && (
            <a
              className="link mt-2 inline-block"
              href="#new-image"
              onClick={(e) => {
                e.preventDefault();
                setData({
                  ...data,
                  images: data.images.concat({
                    id: uniqueId("image"),
                    value: "",
                  }),
                });
              }}
            >
              +Image
            </a>
          )}
        </div>
        <Input
          name="externalUrl"
          label="Link URL"
          value={data.externalUrl}
          onChange={(e) => {
            setData({ ...data, externalUrl: e.target.value });
          }}
        />
        <div>
          <button className="btn-secondary" type="submit">
            Bake
          </button>
        </div>
      </Form>
    </div>
  );
}
