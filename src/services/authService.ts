import { apiClient } from "./apiClient";
import { getCustomerProfileEndpoint } from "./customerDataSourceResolver";
import type { User } from "../types";
import { normalizeDobString } from "../lib/dateUtils";

export const AUTH_STORAGE_KEY = "sass_customer_session";
export const NO_PHONE_ACCOUNT_MESSAGE = "No account registered with this phone number";

export const TEST_CREDENTIALS = {
  phone: "+91 99999 99999",
  cleanPhone: "9999999999",
  otp: "123456",
  defaultUserId: "SASS0000104",
  vipPhone: "+91 94433 12345",
  vipCleanPhone: "9443312345",
  vipEmail: "priya.sundaram@example.com",
  regularEmail: "arun.kumar@example.com",
  defaultPassword: "password123",
  linkedCustomerId: "SASS9999901",
  linkedCustomerEmail: "emulator.linked.customer@sriamman.test",
  linkedCustomerName: "Emulator Test Customer",
};

function stripFirebaseUidFromMockUser(user: User): User {
  const { uid: _ignoredUid, ...mockUser } = user;
  return mockUser;
}

export const authService = {
  async requestOtp(phone: string): Promise<{ success: boolean; message: string }> {
    const cleanNumber = phone.replace(/\D/g, "").slice(-10);
    if (cleanNumber.length !== 10) {
      throw new Error("Please enter a valid 10-digit mobile number.");
    }
    if (![TEST_CREDENTIALS.cleanPhone, TEST_CREDENTIALS.vipCleanPhone].includes(cleanNumber)) {
      throw new Error(NO_PHONE_ACCOUNT_MESSAGE);
    }
    return {
      success: true,
      message: `OTP sent to +91 ${cleanNumber}. (Test OTP: ${TEST_CREDENTIALS.otp})`,
    };
  },

  async verifyOtp(phone: string, otp: string, _referralCode?: string): Promise<User> {
    const cleanNumber = phone.replace(/\D/g, "").slice(-10);
    if (cleanNumber.length !== 10) {
      throw new Error("Please enter a valid 10-digit mobile number.");
    }
    if (otp !== TEST_CREDENTIALS.otp && otp !== "000000") {
      throw new Error(`Invalid OTP. For test login, please use ${TEST_CREDENTIALS.otp}`);
    }
    if (![TEST_CREDENTIALS.cleanPhone, TEST_CREDENTIALS.vipCleanPhone].includes(cleanNumber)) {
      throw new Error(NO_PHONE_ACCOUNT_MESSAGE);
    }

    try {
      // Mock login may resolve existing fixtures only; registration is a separate flow.
      const users = await apiClient.get<User[]>("/users");
      const user = users
        ? users.find((u) => u.phone.replace(/\D/g, "").endsWith(cleanNumber))
        : null;

      if (!user) {
        throw new Error(NO_PHONE_ACCOUNT_MESSAGE);
      }

      const mockUser = stripFirebaseUidFromMockUser(user);

      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      }

      return mockUser;
    } catch (err: any) {
      if (err.message && err.message.includes("Invalid OTP")) {
        throw err;
      }
      throw new Error(err.message || "Authentication failed. Please try again.");
    }
  },

  async loginWithEmail(email: string, password: string): Promise<User> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error("Please enter a valid email address.");
    }
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    try {
      const users = await apiClient.get<User[]>("/users");
      const user = users
        ? users.find((u) => u.email.toLowerCase() === cleanEmail)
        : null;

      if (!user) {
        throw new Error(
          "No account found with this email. Please check your email or sign in with Mobile OTP."
        );
      }

      const mockUser = stripFirebaseUidFromMockUser(user);

      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
      }

      return mockUser;
    } catch (err: any) {
      throw err;
    }
  },

  async validateReferralCode(
    code: string
  ): Promise<{ valid: boolean; bonusCoins: number; message: string }> {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { valid: false, bonusCoins: 0, message: "Please enter a referral code." };
    }
    if (
      cleanCode === "AMMAN50" ||
      cleanCode === "AMMAN100" ||
      cleanCode.startsWith("SASS")
    ) {
      const bonus = cleanCode === "AMMAN100" ? 100 : 50;
      return {
        valid: true,
        bonusCoins: bonus,
        message: `Code ${cleanCode} applied! You will receive ${bonus} bonus Smart Coins.`,
      };
    }
    return {
      valid: false,
      bonusCoins: 0,
      message: "Invalid referral code. Please check and try again.",
    };
  },

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    try {
      const parsed = JSON.parse(stored) as User;
      if (!parsed || typeof parsed !== "object" || typeof parsed.id !== "string") {
        return null;
      }
      return stripFirebaseUidFromMockUser(parsed);
    } catch {
      return null;
    }
  },

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  },

  /**
   * Synchronizes updated customer data (e.g. coin balance changes after order placement)
   * into the active local mock session in localStorage if the updated user matches the
   * current session customer.
   */
  syncUserSession(updatedUser: Partial<User> & { id?: string; userId?: string }): User | null {
    if (typeof window === "undefined") return null;
    const current = this.getCurrentUser();

    const targetId = updatedUser.id || updatedUser.userId;
    if (current && targetId && current.id !== targetId && current.userId !== targetId) {
      return null;
    }

    const resolvedId = targetId || current?.id || current?.userId || "";
    if (!resolvedId) return null;

    const merged: User = {
      ...(current || {}),
      ...updatedUser,
      id: resolvedId,
      userId: resolvedId,
    } as User;
    const clean = stripFirebaseUidFromMockUser(merged);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(clean));
    return clean;
  },

  /**
   * Fetches the authoritative customer profile from the backend storage (/users/:userId),
   * synchronizes it to the local mock session in localStorage, and returns the updated user.
   */
  async fetchUser(userId: string): Promise<User | null> {
    const cleanId = (userId || "").trim();
    if (!cleanId) return null;

    try {
      const endpoint = getCustomerProfileEndpoint(cleanId);
      const user = await apiClient.get<User>(endpoint);
      if (user) {
        const mockUser = stripFirebaseUidFromMockUser(user);
        if (typeof window !== "undefined") {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
        }
        return mockUser;
      }
      return null;
    } catch {
      return this.getCurrentUser();
    }
  },

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const { uid: _ignoredInputUid, birthday: inputBirthday, ...safeData } = data;
    // Canonicalize Date of Birth: always write to `dob`, never write `birthday`
    const rawDob = data.dob ?? inputBirthday;
    const resolvedDob = normalizeDobString(rawDob);
    const finalData = {
      ...safeData,
      ...(resolvedDob !== null ? { dob: resolvedDob } : {}),
    };
    const endpoint = getCustomerProfileEndpoint(userId);
    const updated = await apiClient.patch<User>(endpoint, finalData);
    const mockUser = stripFirebaseUidFromMockUser(updated);
    if (resolvedDob && !mockUser.dob) {
      mockUser.dob = resolvedDob;
    }
    if (mockUser.dob) {
      mockUser.birthday = mockUser.dob;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
    }
    return mockUser;
  },
};
