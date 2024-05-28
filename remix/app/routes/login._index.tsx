import { redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();
  const email = await body.get("email");
  console.log({ email });
  return redirect(`/login/verify`);
}

export default function Login() {
  return (
    <Form method="post">
      <div>
        <div>Email</div>
        <input
          aria-label="Email Address"
          name="email"
          type="text"
          placeholder="e.g. cladode.opuntia@gmail.com"
        />
      </div>
      <button type="submit">Login</button>
    </Form>
  );
}
