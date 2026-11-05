import { getFunctions, httpsCallable } from "firebase/functions";
import { authManager } from "./authAdapter";

export async function checkCustomerPhoneEligibility(phoneNumber: string): Promise<boolean> {
  const app = authManager.getProductionAdapter().getAuthInstance().app;
  const functions = getFunctions(app);
  const checkEligibility = httpsCallable<{ phoneNumber: string }, { eligible: boolean }>(
    functions,
    "checkCustomerPhoneEligibility",
  );
  const result = await checkEligibility({ phoneNumber });
  return result.data?.eligible === true;
}

export function mapPhoneEligibilityError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code
      : "";
  if (code === "functions/resource-exhausted") {
    return "Too many mobile number checks. Please wait a minute before trying again.";
  }
  if (code === "auth/too-many-requests") {
    return "Firebase temporarily blocked OTP requests. Please wait before trying again.";
  }
  return "Unable to check this mobile number right now. Please try again shortly.";
}
