import { Authenticator } from "remix-auth";
import { TOTPStrategy } from "remix-auth-totp";
import { sessionStorage } from "./session.server";
import { sendEmail } from "../../util/email.server";
import { Human, getHumanByEmail } from "../../data/humans.server";
import { LoginCode } from "../../emails/loginCode";

export let authenticator = new Authenticator<Human | undefined>(sessionStorage);

authenticator.use(
  new TOTPStrategy(
    {
      magicLinkPath: "/mrgnt/magic-link",
      secret: process.env.ENCRYPTION_SECRET || "NOT_A_STRONG_SECRET",
      sendTOTP: async ({ email, code, magicLink }) => {
        // Send the TOTP code to the user.
        await sendEmail({
          to: [email],
          subject: "Nopal Login Code",
          react: LoginCode({ code, magicLink }),
        });
      },
    },
    async ({ email }) => {
      const human = getHumanByEmail(email);
      return human;
    }
  ),
  "TOTP"
);
