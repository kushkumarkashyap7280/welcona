import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Welcona <noreply@welcona.com>",
      to: email,
      subject: "Your Welcona Verification Code",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #faf9f6; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 22px; font-weight: 600; color: #2d2418; margin: 0;">Welcona</h1>
            <p style="font-size: 13px; color: #8a7e6e; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 4px;">Premium Bath Fittings</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #e8e2d8; border-radius: 12px; padding: 32px; text-align: center;">
            <p style="font-size: 15px; color: #4a4033; margin: 0 0 8px;">Your verification code is</p>
            <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #b8960c; padding: 16px 0; font-family: monospace;">
              ${otp}
            </div>
            <p style="font-size: 13px; color: #8a7e6e; margin: 16px 0 0;">
              This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
            </p>
          </div>
          <p style="font-size: 12px; color: #b0a898; text-align: center; margin-top: 24px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: "Failed to send email." };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: "Failed to send email." };
  }
}
