import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"
const APP_NAME = "Better Auth Starter"

export async function sendPasswordResetEmail(to: string, url: string) {
    const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject: `Reset your ${APP_NAME} password`,
        html: emailHtml({
            heading: "Reset your password",
            body: "Click the button below to set a new password. This link expires in 1 hour.",
            buttonText: "Reset Password",
            buttonUrl: url,
            footer: "If you didn't request a password reset, you can safely ignore this email."
        })
    })
    if (error) throw new Error(`Resend: ${error.message}`)
}

export async function sendVerificationEmail(to: string, url: string) {
    const { error } = await resend.emails.send({
        from: FROM,
        to,
        subject: `Verify your ${APP_NAME} email`,
        html: emailHtml({
            heading: "Verify your email",
            body: "Click the button below to verify your email address and activate your account.",
            buttonText: "Verify Email",
            buttonUrl: url,
            footer: "If you didn't create an account, you can safely ignore this email."
        })
    })
    if (error) throw new Error(`Resend: ${error.message}`)
}

function emailHtml({
    heading,
    body,
    buttonText,
    buttonUrl,
    footer
}: {
    heading: string
    body: string
    buttonText: string
    buttonUrl: string
    footer: string
}) {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden">
        <tr><td style="padding:32px 32px 24px">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.05em">${APP_NAME}</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#09090b;line-height:1.3">${heading}</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#3f3f46;line-height:1.6">${body}</p>
          <a href="${buttonUrl}" style="display:inline-block;padding:11px 24px;background:#09090b;color:#fff;font-size:14px;font-weight:500;text-decoration:none;border-radius:8px">${buttonText}</a>
        </td></tr>
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #f4f4f5">
          <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.5">${footer}</p>
          <p style="margin:8px 0 0;font-size:12px;color:#d4d4d8">Or copy this link: <a href="${buttonUrl}" style="color:#71717a;word-break:break-all">${buttonUrl}</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
