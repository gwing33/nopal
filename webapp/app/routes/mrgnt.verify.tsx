// app/routes/verify.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { authenticator } from "../modules/auth/auth.server";
import { getSession, commitSession } from "../modules/auth/session.server";
import { Input } from "../components/Input";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    successRedirect: "/mrgnt",
  });

  const session = await getSession(request.headers.get("cookie"));
  const authEmail = session.get("auth:email");
  const authError = session.get(authenticator.sessionErrorKey);
  if (!authEmail) return redirect("/mrgnt/login");

  // Commit session to clear any `flash` error message.
  return json(
    { authError },
    {
      headers: {
        "set-cookie": await commitSession(session),
      },
    }
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const currentPath = url.pathname;

  await authenticator.authenticate("TOTP", request, {
    successRedirect: currentPath,
    failureRedirect: currentPath,
  });
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
      <span>{authError?.message}</span>
    </div>
  );
}
