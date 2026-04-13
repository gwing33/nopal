import { Input } from "../components/Input";
import { Layout } from "../components/Layout";
import { useLoaderData, useActionData, Form } from "react-router";
import {
  data,
  redirect,
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "react-router";
import {
  authenticator,
  getUser,
  getAuthError,
} from "../modules/auth/auth.server";
import { getHumanByEmail } from "../data/humans.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) return redirect("/fruits");

  const authError = getAuthError(request);
  return data({ authError });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.clone().formData();
  const email = formData.get("email") as string;

  const user = await getHumanByEmail(email);
  if (!user) {
    return data(
      { error: "No account found for that email address." },
      { status: 400 },
    );
  }

  // Strategy sends TOTP and throws redirect to /verify
  await authenticator.authenticate("TOTP", request);
}

export default function Login() {
  let { authError } = useLoaderData<typeof loader>();
  let actionData = useActionData<typeof action>();

  return (
    <Layout>
      <div className="w-full max-w-96 mx-auto px-4 py-12">
        <h1 className="text-3xl purple-light-text font-bold mb-4">Login</h1>
        <Form method="POST" className="flex flex-col gap-4 good-box p-4">
          <Input
            label="Email"
            name="email"
            defaultValue=""
            required
            placeholder="you@nature.yeah"
            className={"border border-gray-300 rounded px-2 py-1"}
          />
          {actionData?.error && <div className="red-text">{authError}</div>}
          <div className="text-right">
            <button className="btn-secondary" type="submit">
              Send Code
            </button>
          </div>
        </Form>
      </div>
    </Layout>
  );
}
