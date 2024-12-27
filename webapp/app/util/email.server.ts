import { Resend } from "resend";

export type SendEmailBody = {
  to: string[];
  subject: string;
  html: string;
};

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : undefined;

export async function sendEmail({ to, subject, html }: SendEmailBody) {
  if (!resend) {
    console.log("No RESEND_API_KEY, email not sent.", { to, subject, html });
    return;
  }
  return resend.emails.send({
    from: "Nopal Rowbot <rowbot@updates.nopal.build>",
    to,
    subject,
    html,
  });
}
