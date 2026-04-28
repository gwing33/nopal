import { useState } from "react";
import { Form, useLoaderData, useActionData, useSearchParams } from "react-router";
import { data, redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { Layout } from "../components/Layout";
import { Footer } from "../components/Footer";
import { Input } from "../components/Input";
import { getUser } from "../modules/auth/auth.server";
import { getHumanByEmail, createHuman } from "../data/humans.server";
import { createSeedProject } from "../data/projects.server";
import type { ProjectRole } from "../data/projects.server";
import { sendEmail } from "../util/email.server";
import { WelcomeSeed } from "../emails/welcomeSeed";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return { user };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const ideaOverview = (formData.get("ideaOverview") as string)?.trim() ?? "";
  const northStar = (formData.get("northStar") as string)?.trim();

  if (!name || !email || !northStar) {
    return data(
      { error: "Please fill in all required fields." },
      { status: 400 },
    );
  }

  // Get the logged-in user (reads only cookies, body already consumed above)
  const sessionUser = await getUser(request);

  // Determine the human record to associate with this project
  let human;
  if (sessionUser) {
    human = sessionUser;
  } else {
    const existing = await getHumanByEmail(email);
    if (existing) {
      human = existing;
    } else {
      const created = await createHuman({
        email,
        name: email.split("@")[0],
        role: "MaybeHuman",
      });
      if (!created) {
        return data(
          { error: "Something went wrong creating your account. Please try again." },
          { status: 500 },
        );
      }
      human = created;
    }
  }

  // Admins and Supers seed projects as a Guide; everyone else is a Client
  const humanRole: ProjectRole =
    human.role === "Admin" || human.role === "Super" ? "Guide" : "Client";

  const project = await createSeedProject({
    name,
    northStar,
    ideaOverview,
    humanId: human._id,
    humanRole,
    actorId: human._id,
  });

  if (!project) {
    return data(
      { error: "Failed to create your project. Please try again." },
      { status: 500 },
    );
  }

  // Logged-in users go straight to the project
  if (sessionUser) {
    return redirect(`/fruits/projects/${project._id}`);
  }

  // For guests, send a welcome email and show the success state
  await sendEmail({
    to: [email],
    subject: "Your Nopal seed has been planted 🌱",
    react: WelcomeSeed({ projectName: name, email }),
  });

  return redirect(
    `/plant-seed?planted=1&email=${encodeURIComponent(email)}`,
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlantSeed() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();

  const planted = searchParams.get("planted") === "1";
  const plantedEmail = searchParams.get("email") ?? "";

  const [step, setStep] = useState<1 | 2>(1);

  // Step-1 fields (controlled, never submitted directly)
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");

  // Step-2 fields
  const [northStar, setNorthStar] = useState("");
  const [ideaOverview, setIdeaOverview] = useState("");

  const canAdvanceFromStep1 =
    name.trim().length > 0 && email.trim().length > 0;

  // ------------------------------------------------------------------
  // Success state
  // ------------------------------------------------------------------
  if (planted) {
    return (
      <Layout>
        <div className="scene1">
          <div className="w-full max-w-2xl mx-auto px-4 py-16">
            <div className="good-box p-8 flex flex-col items-center text-center gap-4">
              <div style={{ fontSize: "64px", lineHeight: 1 }}>🌱</div>
              <h1 className="text-3xl purple-light-text font-bold">
                Your seed has been planted.
              </h1>
              <p className="text-lg" style={{ maxWidth: "480px" }}>
                We've received your vision and are glad you're here.
              </p>
              <p className="text-base" style={{ maxWidth: "480px" }}>
                Check your email at{" "}
                <strong className="green-text">{plantedEmail}</strong> —
                we've sent you a confirmation with next steps. When you're
                ready to see your project, log in below.
              </p>
              <a href="/login" className="btn-secondary" style={{ marginTop: "8px" }}>
                Log in to see your project →
              </a>
            </div>
          </div>
        </div>
        <Footer title="Something is growing.">
          Every great project begins with a single seed of intention.
        </Footer>
      </Layout>
    );
  }

  // ------------------------------------------------------------------
  // Step 1: Name your seed
  // ------------------------------------------------------------------
  const step1 = (
    <div>
      <h1 className="text-3xl purple-light-text font-bold mb-2">
        Plant a Seed 🌱
      </h1>
      <p className="italic mb-8" style={{ fontSize: "18px", maxWidth: "480px" }}>
        What you name your project matters. Names carry intention — choose
        with care.
      </p>

      <div className="good-box p-6 flex flex-col gap-6">
        <Input
          label="Project Name"
          name="_name_preview"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="The thing you're building..."
        />

        {user ? (
          <p className="subtle-text text-sm">
            Planting as{" "}
            <strong className="purple-light-text">{user.email}</strong>
          </p>
        ) : (
          <div className="flex flex-col input-component">
            <label className="font-bold" htmlFor="email_preview">
              Your Email
            </label>
            <input
              id="email_preview"
              type="email"
              name="_email_preview"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@nature.yeah"
              style={{ maxHeight: "40px" }}
            />
          </div>
        )}

        <div className="text-right">
          <button
            type="button"
            className="btn-secondary"
            disabled={!canAdvanceFromStep1}
            onClick={() => {
              if (canAdvanceFromStep1) setStep(2);
            }}
          >
            Seed Selected →
          </button>
        </div>
      </div>
    </div>
  );

  // ------------------------------------------------------------------
  // Step 2: North Star & Idea Overview (actual form POST)
  // ------------------------------------------------------------------
  const nsRemaining = 200 - northStar.length;
  const nsColor = nsRemaining <= 20 ? "red-text" : "subtle-text";

  const step2 = (
    <div>
      <h1 className="text-3xl purple-light-text font-bold mb-2">
        Tell us about your dream
      </h1>
      <p className="italic mb-8" style={{ fontSize: "18px", maxWidth: "520px" }}>
        Paint the picture. The more you share, the better we can help you
        bring it to life.
      </p>

      <Form method="POST">
        {/* Carry step-1 data as hidden fields */}
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="email" value={email} />

        <div className="good-box p-6 flex flex-col gap-6">
          {/* Idea Overview */}
          <div className="flex flex-col gap-1">
            <label
              className="purple-light-text font-bold"
              htmlFor="ideaOverview"
            >
              Idea Overview
            </label>
            <p className="subtle-text text-sm" style={{ marginBottom: "6px" }}>
              Describe your project — what it is, what it means to you, what
              you imagine.
            </p>
            <div className="input-component">
              <textarea
                id="ideaOverview"
                name="ideaOverview"
                value={ideaOverview}
                onChange={(e) => setIdeaOverview(e.target.value)}
                placeholder="My dream is to build a home that feels rooted in the land, where the light comes in just right and every space has a purpose..."
                style={{ minHeight: "200px", width: "100%", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* North Star */}
          <div className="flex flex-col gap-1">
            <div
              className="flex justify-between items-baseline"
              style={{ gap: "8px" }}
            >
              <label
                className="purple-light-text font-bold"
                htmlFor="northStar"
              >
                North Star
              </label>
              <span className={`${nsColor} text-sm`} style={{ flexShrink: 0 }}>
                {nsRemaining} left
              </span>
            </div>
            <p className="subtle-text text-sm" style={{ marginBottom: "6px" }}>
              In one sentence: what does success look like for this project?
            </p>
            <div className="input-component">
              <input
                id="northStar"
                name="northStar"
                type="text"
                value={northStar}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setNorthStar(e.target.value);
                  }
                }}
                maxLength={200}
                required
                placeholder="We want a home that feels like it belongs to the landscape..."
                style={{ maxHeight: "40px", width: "100%", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* Action error */}
          {actionData && "error" in actionData && actionData.error && (
            <p className="red-text text-sm">{actionData.error}</p>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
            <button type="submit" className="btn-secondary">
              Plant Seed 🌱
            </button>
          </div>
        </div>
      </Form>
    </div>
  );

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <Layout>
      <div className="scene1">
        <div
          className="w-full mx-auto px-4 py-12"
          style={{ maxWidth: "640px" }}
        >
          {/* Step indicator */}
          <div
            className="flex gap-3 items-center mb-8"
            style={{ opacity: 0.6 }}
          >
            <span
              style={{
                fontWeight: step === 1 ? "bold" : "normal",
                opacity: step === 1 ? 1 : 0.5,
              }}
              className="purple-light-text text-sm"
            >
              1 · Name
            </span>
            <span className="subtle-text text-sm">—</span>
            <span
              style={{
                fontWeight: step === 2 ? "bold" : "normal",
                opacity: step === 2 ? 1 : 0.5,
              }}
              className="purple-light-text text-sm"
            >
              2 · Vision
            </span>
          </div>

          {step === 1 ? step1 : step2}
        </div>
      </div>

      <Footer title="Ready to grow something good?">
        We work with people who care deeply about the spaces they inhabit.
      </Footer>
    </Layout>
  );
}
