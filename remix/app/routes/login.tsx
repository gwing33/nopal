import { Outlet } from "@remix-run/react";
import { Layout } from "../components/layout";

export default function LoginLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
