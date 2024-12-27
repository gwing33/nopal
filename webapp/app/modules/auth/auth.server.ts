import { Authenticator } from "remix-auth";
import { TOTPStrategy } from "remix-auth-totp";
import { sessionStorage } from "./session.server";
import { sendEmail } from "../../util/email.server";
import { User, getUserByEmail } from "../../data/users.server";

export let authenticator = new Authenticator<User | undefined>(sessionStorage);

authenticator.use(
  new TOTPStrategy(
    {
      secret: process.env.ENCRYPTION_SECRET || "NOT_A_STRONG_SECRET",
      sendTOTP: async ({ email, code, magicLink }) => {
        // Send the TOTP code to the user.
        const html = `<div>Code: ${code}</div>
<div><a href="${magicLink}">Click here to verify</a></div>`;
        await sendEmail({
          to: [email],
          subject: "Verify email",
          html: html,
        });
      },
    },
    async ({ email }) => {
      const user = getUserByEmail(email);
      return user;
    }
  ),
  "TOTP"
);
