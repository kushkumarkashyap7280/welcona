import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export type OrderItemForEmail = {
  name: string;
  quantity: number;
  price: number;
};

const DELIVERY_LABELS: Record<string, string> = {
  CUSTOMER_PICKUP: "Customer Pickup (from shop)",
  DELHI: "Delhi Delivery",
  OUTSIDE_DELHI: "Outside Delhi Delivery",
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
  itemsTotal: number,
  deliveryCharge: number,
  deliveryOption: string,
  items: OrderItemForEmail[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const grandTotal = itemsTotal + deliveryCharge;

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amount);

    const itemsHtml = items.map(item => `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e8e2d8; padding-bottom: 8px; margin-bottom: 8px;">
        <div style="flex-grow: 1;">
          <strong style="color: #2d2418;">${item.name}</strong><br/>
          <span style="font-size: 13px; color: #8a7e6e;">Qty: ${item.quantity}</span>
        </div>
        <div style="font-weight: 600; color: #2d2418; text-align: right; min-width: 80px;">₹${item.price}</div>
      </div>
    `).join("");

    const deliveryLabel = DELIVERY_LABELS[deliveryOption] || deliveryOption;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Welcona <noreply@welcona.com>",
      to: email,
      subject: "Order Confirmed - Welcona",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #faf9f6; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 22px; font-weight: 600; color: #2d2418; margin: 0;">Welcona</h1>
            <p style="font-size: 13px; color: #8a7e6e; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 4px;">Premium Bath Fittings</p>
          </div>
          <div style="background: #ffffff; border: 1px solid #e8e2d8; border-radius: 12px; padding: 32px;">
            <p style="font-size: 16px; font-weight: 600; color: #4a4033; margin: 0 0 16px;">
              Order Confirmed!
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
              <strong>Payment Method:</strong> Paid Online (Razorpay)<br/>
              <strong>Payment Status:</strong> Completed
            </div>

            <div style="margin-bottom: 16px; font-size: 13px; color: #4a4033; background: #f5f3ef; border-radius: 8px; padding: 12px;">
              <strong>Delivery Option:</strong> ${deliveryLabel}<br/>
              <strong>Delivery Charge:</strong> ${deliveryCharge > 0 ? formatCurrency(deliveryCharge) : "FREE (Pickup)"}
              ${deliveryOption === "CUSTOMER_PICKUP" ? '<br/><span style="font-size: 12px; color: #b8860b;">⚠ Please pick up within 7 working days (Mon–Sat, 9 AM – 7 PM)</span>' : ""}
              ${deliveryOption === "DELHI" ? '<br/><span style="font-size: 12px; color: #8a7e6e;">Estimated delivery: 1–5 business days</span>' : ""}
              ${deliveryOption === "OUTSIDE_DELHI" ? '<br/><span style="font-size: 12px; color: #8a7e6e;">Estimated delivery: 3–5 business days</span>' : ""}
            </div>
            
            <div style="border-top: 1px solid #e8e2d8; padding-top: 12px; margin-top: 16px;">
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4a4033; margin-bottom: 4px;">
                <span>Items Subtotal</span>
                <span>${formatCurrency(itemsTotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 13px; color: #4a4033; margin-bottom: 8px;">
                <span>Delivery Charge</span>
                <span>${deliveryCharge > 0 ? formatCurrency(deliveryCharge) : "FREE"}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e8e2d8; padding-top: 12px;">
                <span style="font-size: 14px; font-weight: 600; color: #4a4033;">Grand Total</span>
                <span style="font-size: 18px; font-weight: 700; color: #b8960c;">${formatCurrency(grandTotal)}</span>
              </div>
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
  itemsTotal: number,
  deliveryCharge: number,
  deliveryOption: string,
  items: OrderItemForEmail[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const grandTotal = itemsTotal + deliveryCharge;

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amount);

    const itemsHtml = items.map(item => `
      <div style="border-bottom: 1px solid #e8e2d8; padding-bottom: 6px; margin-bottom: 6px; font-size: 14px;">
        <span style="color: #2d2418;">${item.name}</span> (Qty: ${item.quantity}) - <span style="font-weight: 600;">₹${item.price}</span>
      </div>
    `).join("");

    const deliveryLabel = DELIVERY_LABELS[deliveryOption] || deliveryOption;

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Welcona Admin Alerts <noreply@welcona.com>",
      to: adminEmail,
      subject: `New Order Alert #${orderId.split("-")[0].toUpperCase()} [ONLINE | ${deliveryLabel}]`,
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

            <h3 style="font-size: 15px; border-bottom: 1px solid #e8e2d8; padding-bottom: 8px; margin-top: 24px; color: #b8960c;">Delivery Details</h3>
            <div style="font-size: 14px; margin: 8px 0; background: #f5f3ef; border-radius: 8px; padding: 12px;">
              <strong>Delivery Option:</strong> ${deliveryLabel}<br/>
              <strong>Delivery Charge:</strong> ${deliveryCharge > 0 ? formatCurrency(deliveryCharge) : "FREE (Pickup)"}
              ${deliveryOption === "CUSTOMER_PICKUP" ? '<br/><span style="font-size: 12px; color: #b8860b;">⚠ Customer needs to pick up within 7 working days</span>' : ""}
            </div>
            
            <h3 style="font-size: 15px; border-bottom: 1px solid #e8e2d8; padding-bottom: 8px; margin-top: 24px; color: #b8960c;">Order Summary</h3>
            <div style="margin-top: 12px;">
              ${itemsHtml}
            </div>
            
            <div style="margin-top: 16px; font-size: 14px;">
              <strong>Payment Method:</strong> ONLINE (Razorpay)<br/>
              <strong>Payment Status:</strong> COMPLETED
            </div>
            
            <div style="border-top: 1px solid #e8e2d8; padding-top: 12px; margin-top: 16px;">
              <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px;">
                <span>Items Subtotal</span>
                <span style="font-weight: 600;">${formatCurrency(itemsTotal)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px;">
                <span>Delivery Charge</span>
                <span style="font-weight: 600;">${deliveryCharge > 0 ? formatCurrency(deliveryCharge) : "FREE"}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e8e2d8; padding-top: 12px;">
                <span style="font-size: 14px; font-weight: 600;">Grand Total</span>
                <span style="font-size: 20px; font-weight: 700; color: #b8960c;">${formatCurrency(grandTotal)}</span>
              </div>
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

// ─── ADMIN HEALTH CHECK EMAIL ────────────────────────────────────────────────
export async function sendAdminHealthCheckEmail(
  adminEmail: string,
  productCount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const formattedDate = new Intl.DateTimeFormat("en-IN", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date());

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Welcona Status <noreply@welcona.com>",
      to: adminEmail,
      subject: `[Healthy] Welcona System Status Report`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 24px; background: #f4fbf7; border-radius: 16px; border: 1px solid #d1fae5;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; background: #d1fae5; border-radius: 50%; padding: 16px; margin-bottom: 16px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h1 style="font-size: 24px; font-weight: 700; color: #065f46; margin: 0;">Welcona System Status</h1>
            <p style="font-size: 13px; color: #047857; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 4px; font-weight: 600;">Automated Health Report</p>
          </div>
          
          <div style="background: #ffffff; border: 1px solid #e6f4ea; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="display: flex; align-items: center; justify-content: center; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; text-align: center;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: #10b981; border-radius: 50%; margin-right: 8px;"></span>
              <span style="font-size: 15px; font-weight: 700; color: #065f46; letter-spacing: 0.05em;">SITE IS HEALTHY</span>
            </div>

            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 20px; text-align: center;">
              Hello Admin,<br/>
              We are pleased to report that the site is fully functional, database connectivity is active, and all systems are healthy.
            </p>

            <div style="border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; padding: 20px 0; margin-bottom: 20px;">
              <div style="text-align: center;">
                <span style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 6px;">Total Active Products</span>
                <span style="font-size: 36px; font-weight: 800; color: #10b981; display: block; line-height: 1;">${productCount}</span>
              </div>
            </div>

            <div style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5;">
              <strong>Report Timestamp:</strong> ${formattedDate}<br/>
              <strong>Status:</strong> All Systems Operational
            </div>
          </div>
          
          <p style="text-align: center; font-size: 12px; color: #9ca3af; margin-top: 24px; margin-bottom: 0;">
            &copy; ${new Date().getFullYear()} Welcona. All rights reserved.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend health check email error:", error);
      return { success: false, error: "Failed to send email." };
    }

    return { success: true };
  } catch (err) {
    console.error("Health check email exception:", err);
    return { success: false, error: "Failed to send email." };
  }
}
