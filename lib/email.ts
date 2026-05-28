import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type OrderItemForEmail = {
  name: string;
  quantity: number;
  price: number;
};

// ─── STUB OTP EMAIL (COMPATIBILITY) ─────────────────────────────────────────
export async function sendOtpEmail(
  email: string,
  otp: string,
  subject: string = "Verification Code"
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

// ─── CUSTOMER ORDER CONFIRMATION EMAIL ───────────────────────────────────────
export async function sendPaymentSuccessEmail(
  email: string,
  orderId: string,
  totalAmount: number,
  items: OrderItemForEmail[],
  paymentMethod: string = "ONLINE"
): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedTotal = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(totalAmount);

    const itemsHtml = items.map(item => `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e8e2d8; padding-bottom: 8px; margin-bottom: 8px;">
        <div style="flex-grow: 1;">
          <strong style="color: #2d2418;">${item.name}</strong><br/>
          <span style="font-size: 13px; color: #8a7e6e;">Qty: ${item.quantity}</span>
        </div>
        <div style="font-weight: 600; color: #2d2418; text-align: right; min-width: 80px;">₹${item.price}</div>
      </div>
    `).join("");

    const isCod = paymentMethod === "CASH_ON_DELIVERY";

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Welcona <noreply@welcona.com>",
      to: email,
      subject: isCod ? "Order Received - Cash on Delivery" : "Order Confirmed - Welcona",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #faf9f6; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 22px; font-weight: 600; color: #2d2418; margin: 0;">Welcona</h1>
            <p style="font-size: 13px; color: #8a7e6e; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 4px;">Premium Bath Fittings</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #e8e2d8; border-radius: 12px; padding: 32px;">
            <p style="font-size: 16px; font-weight: 600; color: #4a4033; margin: 0 0 16px;">
              ${isCod ? "Order Received!" : "Order Confirmed!"}
            </p>
            <p style="font-size: 14px; color: #4a4033; margin: 0 0 24px;">
              Thank you for your purchase. Your order <strong>#${orderId.split("-")[0].toUpperCase()}</strong> has been received and is being processed.
            </p>
            
            <div style="margin-bottom: 24px;">
              <h3 style="font-size: 13px; color: #8a7e6e; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e8e2d8; padding-bottom: 8px;">Order Summary</h3>
              <div style="margin-top: 12px;">
                ${itemsHtml}
              </div>
            </div>
            
            <div style="margin-bottom: 16px; font-size: 13px; color: #4a4033;">
              <strong>Payment Method:</strong> ${isCod ? "Cash on Delivery (COD)" : "Paid Online (Razorpay)"}<br/>
              <strong>Payment Status:</strong> ${isCod ? "Pending Approval" : "Completed"}
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e8e2d8; padding-top: 16px; margin-top: 24px;">
              <span style="font-size: 14px; font-weight: 600; color: #4a4033;">Total Amount</span>
              <span style="font-size: 18px; font-weight: 700; color: #b8960c;">${formattedTotal}</span>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend customer email error:", error);
      return { success: false, error: "Failed to send email." };
    }

    return { success: true };
  } catch (err) {
    console.error("Customer email exception:", err);
    return { success: false, error: "Failed to send email." };
  }
}

// ─── ADMIN NEW ORDER NOTIFICATION EMAIL ─────────────────────────────────────
export async function sendAdminOrderNotificationEmail(
  adminEmail: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string,
  shippingAddress: string,
  orderId: string,
  totalAmount: number,
  items: OrderItemForEmail[],
  paymentMethod: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedTotal = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(totalAmount);

    const itemsHtml = items.map(item => `
      <div style="border-bottom: 1px solid #e8e2d8; padding-bottom: 6px; margin-bottom: 6px; font-size: 14px;">
        <span style="color: #2d2418;">${item.name}</span> (Qty: ${item.quantity}) - <span style="font-weight: 600;">₹${item.price}</span>
      </div>
    `).join("");

    const isCod = paymentMethod === "CASH_ON_DELIVERY";

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Welcona Admin Alerts <noreply@welcona.com>",
      to: adminEmail,
      subject: `New Order Alert #${orderId.split("-")[0].toUpperCase()} [${paymentMethod}]`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 20px; background: #faf9f6; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #2d2418; margin: 0;">Welcona Admin Notification</h2>
            <p style="font-size: 13px; color: #8a7e6e; margin-top: 4px;">A new order has been submitted</p>
          </div>
          
          <div style="background: #ffffff; border: 1px solid #e8e2d8; border-radius: 8px; padding: 24px; color: #4a4033; line-height: 1.5;">
            <h3 style="font-size: 15px; border-bottom: 1px solid #e8e2d8; padding-bottom: 8px; margin-top: 0; color: #b8960c;">Customer Details</h3>
            <p style="font-size: 14px; margin: 8px 0;">
              <strong>Name:</strong> ${customerName}<br/>
              <strong>Email:</strong> ${customerEmail}<br/>
              <strong>Phone:</strong> ${customerPhone}<br/>
              <strong>Shipping Address:</strong><br/>
              <span style="color: #8a7e6e; display: inline-block; margin-top: 4px;">${shippingAddress}</span>
            </p>
            
            <h3 style="font-size: 15px; border-bottom: 1px solid #e8e2d8; padding-bottom: 8px; margin-top: 24px; color: #b8960c;">Order Summary</h3>
            <div style="margin-top: 12px;">
              ${itemsHtml}
            </div>
            
            <div style="margin-top: 16px; font-size: 14px;">
              <strong>Payment Method:</strong> ${paymentMethod}<br/>
              <strong>Payment Status:</strong> ${isCod ? "PENDING (Requires Admin approval)" : "COMPLETED"}
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e8e2d8; padding-top: 16px; margin-top: 24px;">
              <span style="font-size: 14px; font-weight: 600;">Total Order Value</span>
              <span style="font-size: 20px; font-weight: 700; color: #b8960c;">${formattedTotal}</span>
            </div>
          </div>
          
          <p style="text-align: center; font-size: 12px; color: #b0a898; margin-top: 24px;">
            Please log in to the admin panel to manage this order.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend admin notification email error:", error);
      return { success: false, error: "Failed to send email." };
    }

    return { success: true };
  } catch (err) {
    console.error("Admin notification email exception:", err);
    return { success: false, error: "Failed to send email." };
  }
}
