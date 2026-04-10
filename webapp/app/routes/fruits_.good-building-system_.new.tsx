// app/routes/fruits_.good-building-system.new.tsx
import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import { createBuildingSystem } from "../data/buildingSystem.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/login");

  const isAdmin = user.role === "Admin" || user.role === "Super";
  if (!isAdmin) return redirect("/fruits/good-building-system");

  const bs = await createBuildingSystem({
    name: "Untitled",
    slug: "",
    blocks: [{ type: "markdown", md: "" }],
    categoryId: "",
  });

  if (!bs) throw new Response("Failed to create building system", { status: 500 });

  return redirect(`/fruits/good-building-system/${bs._id}`);
}

// This component never renders — the loader always redirects.
export default function NewBuildingSystem() {
  return null;
}
