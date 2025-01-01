import { useState } from "react";
import { Input } from "../components/Input";
import { Autocomplete } from "../components/Autocomplete";
import {
  json,
  redirect,
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { authenticator } from "../modules/auth/auth.server";
import { uniqueId } from "../util/uniqueId";
import {
  createUncooked,
  ArtMedium,
  CreateUncookedParams,
} from "../data/uncooked.server";
import { CreateBatchOptions } from "resend";

const types = [
  "newspaper-clipping",
  "print",
  "betamax",
  "view-master-reel",
  "presentation",
];

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request, {
    failureRedirect: "/mrgnt/login",
  });
  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const type = formData.get("type")?.toString() as ArtMedium;
  const author = formData.get("author")?.toString() || "";
  const title = formData.get("title")?.toString() || "";
  const body = formData.get("body")?.toString() || "";

  const data: CreateUncookedParams = {
    type,
    author,
    title,
    body,
    images: formData
      .getAll("image")
      .map((i) => i.toString())
      .filter((i) => !i),
    externalUrl: formData.get("externalUrl")?.toString(),
  };

  if (!data.type || !data.author || !data.title || !data.body) {
    return json({ error: "Missing fields", ...data });
  }

  const resp = await createUncooked(data);

  try {
    // Add submission logic here
    return redirect("/mrgnt");
  } catch (error) {
    return json({ error: "Failed to create uncooked thought", ...data });
  }
}

export default function MrgntUncookedManage() {
  const actionData = useActionData<typeof action>();
  const [data, setData] = useState({
    type: actionData?.type || "",
    author: actionData?.author || "",
    title: actionData?.title || "",
    body: actionData?.body || "",
    images: (actionData?.images || [""]).map((i) => ({
      id: uniqueId("image"),
      value: i,
    })),
  });

  const isFormValid = () => {
    return (
      data.type.trim() !== "" &&
      data.author.trim() !== "" &&
      data.title.trim() !== "" &&
      data.body.trim() !== ""
    );
  };

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
          required
          value={data?.title || ""}
          onChange={(e) => setData({ ...data, title: e.target.value })}
        />
        <Input
          label="Markdown Body"
          name="body"
          type="textarea"
          required
          value={data?.body || ""}
          onChange={(e) => setData({ ...data, body: e.target.value })}
        />
        <div>
          {data.images.map((image, i) => (
            <div key={image.id} className={i > 0 ? "mt-4" : ""}>
              <Input
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
          defaultValue={actionData?.externalUrl || ""}
        />
        <div>
          <button
            className="btn-secondary"
            type="submit"
            disabled={!isFormValid()}
            style={{
              opacity: isFormValid() ? 1 : 0.5,
              cursor: isFormValid() ? "pointer" : "not-allowed",
            }}
          >
            Bake
          </button>
        </div>
      </Form>
      {actionData?.error && (
        <div className="text-red-500 mt-2">{actionData.error}</div>
      )}
    </div>
  );
}
