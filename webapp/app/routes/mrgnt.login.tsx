import { useState } from "react";
import { Input } from "../components/Input";
import { useLoaderData, useActionData, Form } from "@remix-run/react";
import {
  json,
  redirect,
  ActionFunctionArgs,
  LoaderFunctionArgs,
} from "@remix-run/node";
import { authenticator } from "../modules/auth/auth.server";
import { getSession, commitSession } from "../modules/auth/session.server";
import { getUserByEmail } from "../data/users.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    successRedirect: "/mrgnt",
  });

  const session = await getSession(request.headers.get("Cookie"));
  const authError = session.get(authenticator.sessionErrorKey);

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
  const formData = await request.clone().formData();
  const email = formData.get("email") as string;

  const user = await getUserByEmail(email);
  if (!user) {
    return json(
      { error: "No account found for that email address." },
      { status: 400 }
    );
  }

  await authenticator.authenticate("TOTP", request, {
    // The `successRedirect` route will be used to verify the OTP code.
    // This could be the current pathname or any other route that renders the verification form.
    successRedirect: "/mrgnt/verify",

    // The `failureRedirect` route will be used to render any possible error.
    // This could be the current pathname or any other route that renders the login form.
    failureRedirect: "/mrgnt/login",
  });
}

export default function MrgntLogin() {
  let { authError } = useLoaderData<typeof loader>();
  let actionData = useActionData<typeof action>();

  return (
    <div>
      <h1 className="font-bold mb-4"># MRGNT Login</h1>
      <Form method="POST" className="w-72 flex flex-col gap-4">
        <Input label="Email" name="email" required />
        <div>
          <button className="btn-secondary" type="submit">
            Send Code
          </button>
        </div>
      </Form>
      <span>{actionData?.error ?? authError?.message}</span>
    </div>
  );
}
