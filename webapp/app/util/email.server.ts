import { ReactNode } from "react";
import { Resend } from "resend";

export type SendEmailBody = {
  to: string[];
  subject: string;
  react: ReactNode;
};

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : undefined;

export async function sendEmail({ to, subject, react }: SendEmailBody) {
  if (!resend) {
    console.log("No RESEND_API_KEY, email not sent.", { to, subject });
    return;
  }
  return resend.emails.send({
    from: "Nopal Rowbot <rowbot@nopal.build>",
    to,
    subject,
    react,
  });
}
