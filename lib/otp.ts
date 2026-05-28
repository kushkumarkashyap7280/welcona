// OTP management disabled under the simplified 35k plan.
// Stubs are provided below to prevent compilation errors if referenced.

export type OtpType = "USER_SIGNUP" | "ADMIN_LOGIN" | "USER_PASSWORD_RESET" | "ADMIN_PASSWORD_RESET";

export const OTP_SETTINGS = {} as any;

export function generateOtp(): string {
  return "000000";
}

export async function sendCentralizedOtp(
  email: string,
  type: OtpType
): Promise<{ success?: boolean; error?: string }> {
  return { success: true };
}

export async function verifyCentralizedOtp(
  email: string,
  code: string,
  type: OtpType,
  deleteOnVerify = true
): Promise<{ success?: boolean; error?: string }> {
  return { success: true };
}
