// app/routes/verify.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data, redirect } from "react-router";
import { Form, useLoaderData } from "react-router";
import {
  authenticator,
  getUser,
  getAuthError,
  getAuthEmail,
} from "../modules/auth/auth.server";
import { Input } from "../components/Input";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (user) return redirect("/mrgnt");

  const authEmail = getAuthEmail(request);
  const authError = getAuthError(request);
  if (!authEmail) return redirect("/mrgnt/login");

  return data({ authError });
}

export async function action({ request }: ActionFunctionArgs) {
  // Strategy validates the code (or resends if no code), handles all redirects
  await authenticator.authenticate("TOTP", request);
}

export default function Verify() {
  const { authError } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="font-bold mb-4"># MRGNT Login</h1>
      <Form method="POST" className="w-72 flex flex-col gap-4">
        <Input label="Code" name="code" required />
        <div>
          <button className="btn-secondary" type="submit">
            Continue
          </button>
        </div>
      </Form>
      <div className="mt-8">
        ...or{" "}
        <Form method="POST" className="inline-flex">
          <button className="link" type="submit">
            request new code
          </button>
        </Form>
        .
      </div>
      <span>{authError}</span>
    </div>
  );
}
