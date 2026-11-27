import { connectFunctionsEmulator, getFunctions, httpsCallable } from "firebase/functions";
import { authManager } from "./authAdapter";

let emulatorConnectionAttempted = false;

function getCallableFunctions() {
  const adapter = authManager.getMode() === "production"
    ? authManager.getProductionAdapter()
    : authManager.getEmulatorAdapter();
  const { app } = adapter.getAuthInstance();
  const functions = getFunctions(app, "asia-south1");
  if (authManager.getMode() === "emulator" && !emulatorConnectionAttempted) {
    const host = import.meta.env?.VITE_FIREBASE_FUNCTIONS_EMULATOR_HOST || "127.0.0.1";
    const port = Number(import.meta.env?.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT || 5001);
    connectFunctionsEmulator(functions, host, port);
    emulatorConnectionAttempted = true;
  }
  return functions;
}

export async function requestEmailPhoneOtp(email: string, recaptchaToken: string): Promise<{ challengeId: string; message: string }> {
  const requestCode = httpsCallable<
    { email: string; recaptchaToken: string },
    { challengeId: string; message: string }
  >(getCallableFunctions(), "requestCustomerEmailPhoneOtp");
  const result = await requestCode({
    email: email.trim().toLowerCase(),
    recaptchaToken,
  });
  return result.data;
}

export async function verifyEmailPhoneOtp(challengeId: string, code: string): Promise<string> {
  const verifyCode = httpsCallable<
    { challengeId: string; code: string },
    { customToken: string }
  >(getCallableFunctions(), "verifyCustomerEmailPhoneOtp");
  const result = await verifyCode({
    challengeId,
    code,
  });
  return result.data.customToken;
}
