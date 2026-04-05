import { useEffect, useState } from "react";
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "react-router";
import { Form, useActionData, useNavigation } from "react-router";
import { getUser } from "../modules/auth/auth.server";
import { syncAllDatabases } from "../data/notion/sync.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return redirect("/mrgnt/login");
  return { user };
}

export async function action({ request }: ActionFunctionArgs) {
  try {
    const response = await syncAllDatabases();
    return { error: null, response };
  } catch (error) {
    console.error(error);
    return { error: "Failed to sync." };
  }
}

export default function MrgntUncookedManage() {
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const error = actionData?.error;
  const status = navigation.state === "submitting" ? "in progress" : "idle";

  return (
    <div>
      <h1 className="purple-light-text text-2xl mb-4">
        Good Building Score Sync
      </h1>
      {error && <p className="text-red-500">{error}</p>}
      {status === "in progress" ? (
        <p>
          Sync in progress
          <ProgressDots />
        </p>
      ) : (
        <Form method="post" className="btn-primary w-72 flex flex-col gap-4">
          <button type="submit">Start Sync</button>
        </Form>
      )}
    </div>
  );
}

function ProgressDots() {
  const [counter, setCounter] = useState(0);
  useEffect(() => {
    const i = setInterval(() => {
      setCounter((c) => c + 1);
    }, 500);
    return () => {
      clearInterval(i);
    };
  }, []);

  switch (counter % 4) {
    case 1:
      return "..";
    case 2:
      return "...";
    case 3:
      return "....";
    default:
    case 0:
      return ".";
  }
}
