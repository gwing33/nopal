import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticator } from "../modules/auth/auth.server";

export async function loader({ request }: ActionFunctionArgs) {
  return await authenticator.logout(request, {
    redirectTo: "/",
  });
}
