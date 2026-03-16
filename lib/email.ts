import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(
  email: string,
  otp: string,
  subject: string = "Your Welcona Verification Code"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Welcona <noreply@welcona.com>",
      to: email,
      subject,
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

export type OrderItemForEmail = {
  name: string;
  quantity: number;
  price: number;
};

export async function sendPaymentSuccessEmail(
  email: string,
  orderId: string,
  totalAmount: number,
  items: OrderItemForEmail[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedTotal = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(totalAmount);

    const itemsHtml = items.map(item => `
      <div style="flex; justify-content: space-between; border-bottom: 1px solid #e8e2d8; padding-bottom: 8px; margin-bottom: 8px;">
        <div>
          <strong style="color: #2d2418;">${item.name}</strong><br/>
          <span style="font-size: 13px; color: #8a7e6e;">Qty: ${item.quantity}</span>
        </div>
        <div style="font-weight: 600; color: #2d2418;">₹${item.price}</div>
      </div>
    `).join("");

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Welcona <noreply@welcona.com>",
      to: email,
      subject: "Order Confirmation - Welcona",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #faf9f6; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 22px; font-weight: 600; color: #2d2418; margin: 0;">Welcona</h1>
            <p style="font-size: 13px; color: #8a7e6e; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 4px;">Premium Bath Fittings</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #e8e2d8; border-radius: 12px; padding: 32px;">
            <p style="font-size: 16px; font-weight: 600; color: #4a4033; margin: 0 0 16px;">Order Confirmed!</p>
            <p style="font-size: 14px; color: #4a4033; margin: 0 0 24px;">Thank you for your purchase. Your order <strong>#${orderId.split("-")[0].toUpperCase()}</strong> has been received.</p>
            
            <div style="margin-bottom: 24px;">
              <h3 style="font-size: 13px; color: #8a7e6e; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e8e2d8; padding-bottom: 8px;">Order Summary</h3>
              <div style="margin-top: 12px;">
                ${itemsHtml}
              </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e8e2d8; padding-top: 16px; margin-top: 24px;">
              <span style="font-size: 14px; font-weight: 600; color: #4a4033;">Total Paid</span>
              <span style="font-size: 18px; font-weight: 700; color: #b8960c;">${formattedTotal}</span>
            </div>
          </div>
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
