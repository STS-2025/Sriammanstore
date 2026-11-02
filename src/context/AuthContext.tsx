import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { apiClient } from "../services/apiClient";
import { getCustomerProfileEndpoint } from "../services/customerDataSourceResolver";
import { authService, TEST_CREDENTIALS } from "../services/authService";
import {
  emailLinkAuthService,
  type FirebaseEmailLinkAuthUser,
} from "../services/emailLinkAuthService";
import {
  customerIdentityService,
  type CustomerIdentityResolutionResult,
  type CustomerIdentityResolutionStatus,
  type CustomerIdentityErrorCode,
} from "../services/customerIdentityService";
import { notificationService } from "../services/notificationService";
import {
  authManager,
  type AuthMode,
  type AuthStatus,
  type AuthUserIdentity,
} from "../services/authAdapter";
import type { User } from "../types";
import { normalizeDobString } from "../lib/dateUtils";

export type AuthSessionType = "mock" | "firebase" | null;

export interface IdentityResolutionNotice {
  status: Exclude<CustomerIdentityResolutionStatus, "resolved">;
  code: CustomerIdentityErrorCode;
  title: string;
  userMessage: string;
  isRetryable: boolean;
}

/**
 * Maps any non-resolved `CustomerIdentityResolutionResult` into a customer-safe
 * UI notice that clearly distinguishes `unlinked`, `missing_profile`,
 * `malformed_mapping`, `profile_id_mismatch`, `database_error`, and
 * `unauthenticated` without leaking internal Firestore paths or other users' IDs.
 */
export function describeIdentityResolutionState(
  result: CustomerIdentityResolutionResult | null | undefined,
): IdentityResolutionNotice | null {
  if (!result || result.status === "resolved") {
    return null;
  }

  switch (result.status) {
    case "unlinked":
      return {
        status: "unlinked",
        code: result.code,
        title: "Customer Account Not Linked",
        userMessage:
          "Firebase authenticated this sign-in, but no Sri Amman Smart Store customer account is linked to it yet. Accounts are never linked by email or phone alone, and no profile was created automatically. Please sign out or contact support while secure registration is pending.",
        isRetryable: false,
      };
    case "missing_profile":
      return {
        status: "missing_profile",
        code: result.code,
        title: "Customer Profile Record Not Found",
        userMessage:
          "Your sign-in is linked to a customer record that could not be found in the store database. Please sign out and contact Sri Amman Smart Store support for assistance.",
        isRetryable: false,
      };
    case "malformed_mapping":
      return {
        status: "malformed_mapping",
        code: result.code,
        title: "Account Link Configuration Issue",
        userMessage:
          "We could not verify your customer account link because the identity mapping record is invalid or incomplete. Please sign out and contact store support.",
        isRetryable: false,
      };
    case "profile_id_mismatch":
      return {
        status: "profile_id_mismatch",
        code: result.code,
        title: "Customer Profile Identity Mismatch",
        userMessage:
          "We detected an identity mismatch on the linked customer profile and stopped sign-in to protect your account. Please sign out and contact store support.",
        isRetryable: false,
      };
    case "database_error":
      return {
        status: "database_error",
        code: result.code,
        title: result.isEmulatorUnavailable
          ? "Customer Data Service Unavailable"
          : "Unable to Load Customer Profile",
        userMessage: result.isEmulatorUnavailable
          ? "Could not reach the customer data service to resolve your profile. Check your connection and try again, or sign out."
          : "A database error occurred while resolving your customer profile. Please try again or sign out.",
        isRetryable: true,
      };
    case "unauthenticated":
      return {
        status: "unauthenticated",
        code: result.code,
        title: "Email Verification Required",
        userMessage:
          "Your email sign-in session is not verified. Please request and complete a valid email sign-in link.",
        isRetryable: false,
      };
  }
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionType: AuthSessionType;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  authStatus: AuthStatus;
  firebaseUser: FirebaseEmailLinkAuthUser | AuthUserIdentity | null;
  identityResolution: CustomerIdentityResolutionResult | null;
  identityNotice: IdentityResolutionNotice | null;
  isResolvingIdentity: boolean;
  login: (phone: string, otp: string, referralCode?: string) => Promise<User>;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  loginWithFirebaseAuth: (
    email: string,
    password: string,
  ) => Promise<CustomerIdentityResolutionResult>;
  completeEmailLinkSignIn: (
    linkUrl: string,
    emailOverride?: string,
  ) => Promise<CustomerIdentityResolutionResult>;
  resolveFirebaseSession: (
    overrideUser?: FirebaseEmailLinkAuthUser | AuthUserIdentity | null,
    options?: { force?: boolean },
  ) => Promise<CustomerIdentityResolutionResult>;
  validateReferralCode: (
    code: string,
  ) => Promise<{ valid: boolean; bonusCoins: number; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  testCredentials: typeof TEST_CREDENTIALS;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const getAuxiliaryFirebaseUser = () =>
    authManager.getMode() === "production"
      ? null
      : emailLinkAuthService.getCurrentFirebaseAuthUser();

  const [authMode, setAuthModeState] = useState<AuthMode>(() => authManager.getMode());

  const [user, setUser] = useState<User | null>(() => {
    // Never hydrate a mock/localStorage session into the initial production auth state.
    if (authManager.getMode() === "production") return null;
    try {
      const mockUser = authService.getCurrentUser();
      if (mockUser && customerIdentityService.isMockSessionUser(mockUser)) {
        return mockUser;
      }
    } catch {
      // Ignore storage access errors during SSR/initial mount
    }
    return null;
  });

  const [sessionType, setSessionType] = useState<AuthSessionType>(() => {
    // Production mode must begin without a mock session type.
    if (authManager.getMode() === "production") return null;
    try {
      const mockUser = authService.getCurrentUser();
      if (mockUser && customerIdentityService.isMockSessionUser(mockUser)) {
        return "mock";
      }
    } catch {
      // Ignore
    }
    return null;
  });

  const setAuthMode = useCallback((newMode: AuthMode) => {
    if (import.meta.env.MODE !== "test" && newMode !== "production") return;
    authManager.setMode(newMode);
    setAuthModeState(newMode);
    setIsLoading(true);
    if (typeof window !== "undefined") {
      try {
        if (newMode === "production" || newMode === "mock") {
          window.sessionStorage.setItem("sass_auth_mode", newMode);
          window.localStorage.setItem("sass_auth_mode", newMode);
        } else {
          window.sessionStorage.removeItem("sass_auth_mode");
          window.localStorage.removeItem("sass_auth_mode");
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const [firebaseUser, setFirebaseUser] = useState<
    AuthUserIdentity | FirebaseEmailLinkAuthUser | null
  >(() => {
    try {
      const initialMode = authManager.getMode();
      if (initialMode === "production") {
        return authManager.getCurrentUser();
      }
      return getAuxiliaryFirebaseUser() || authManager.getCurrentUser();
    } catch {
      return null;
    }
  });
  const [identityResolution, setIdentityResolution] =
    useState<CustomerIdentityResolutionResult | null>(null);
  const [isResolvingIdentity, setIsResolvingIdentity] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isMountedRef = useRef<boolean>(true);
  const sessionTypeRef = useRef<AuthSessionType>(sessionType);
  sessionTypeRef.current = sessionType;

  // Deduplicates concurrent profile resolutions for the same Firebase UID
  const inFlightResolutionRef = useRef<{
    uid: string;
    promise: Promise<CustomerIdentityResolutionResult>;
  } | null>(null);
  const latestResolvedForUidRef = useRef<{
    uid: string;
    result: CustomerIdentityResolutionResult;
  } | null>(null);

  const applyFirebaseResolution = useCallback(
    (
      fbUser: AuthUserIdentity | FirebaseEmailLinkAuthUser,
      result: CustomerIdentityResolutionResult,
    ) => {
      if (!isMountedRef.current) return;
      // Always clear any leftover mock session when a Firebase Auth user is active
      // so a failed Firebase resolution can never silently fall back to a mock session
      authService.logout();
      setFirebaseUser(fbUser);
      setIdentityResolution(result);

      if (result.status === "resolved") {
        setUser(result.profile);
        setSessionType("firebase");
        apiClient.setLegacyCustomerSubcollectionsEnabled(true);
      } else {
        // Never treat an unlinked or errored Firebase user as an authenticated SASS customer session
        setUser(null);
        setSessionType(null);
        apiClient.setLegacyCustomerSubcollectionsEnabled(false);
      }
    },
    [],
  );

  const resolveFirebaseUserInternal = useCallback(
    async (
      candidateUser: AuthUserIdentity | FirebaseEmailLinkAuthUser | null | undefined,
      options?: { force?: boolean },
    ): Promise<CustomerIdentityResolutionResult> => {
      if (!candidateUser || !candidateUser.uid) {
        const unauthResult: CustomerIdentityResolutionResult = {
          status: "unauthenticated",
          ok: false,
          code: "identity/unauthenticated",
          uid: null,
          userDocId: null,
          profile: null,
          message: "Cannot resolve customer profile: no authenticated Firebase user was provided.",
        };
        if (isMountedRef.current) {
          setFirebaseUser(null);
          setIdentityResolution(null);
          if (sessionTypeRef.current === "firebase") {
            setUser(null);
            setSessionType(null);
          }
        }
        return unauthResult;
      }

      // For email-link authentication, verify that the email was verified
      if (
        candidateUser.providerId === "firebase-email-link" &&
        candidateUser.emailVerified !== true
      ) {
        authService.logout();
        const unverifiedResult = await customerIdentityService.resolveCustomerProfile({
          ...candidateUser,
          emailVerified: false,
        });
        if (isMountedRef.current) {
          setFirebaseUser(candidateUser);
          setIdentityResolution(unverifiedResult);
          setUser(null);
          setSessionType(null);
        }
        return unverifiedResult;
      }

      const targetUid = candidateUser.uid;

      if (
        !options?.force &&
        inFlightResolutionRef.current &&
        inFlightResolutionRef.current.uid === targetUid
      ) {
        return inFlightResolutionRef.current.promise;
      }

      if (
        !options?.force &&
        latestResolvedForUidRef.current &&
        latestResolvedForUidRef.current.uid === targetUid &&
        latestResolvedForUidRef.current.result.status === "resolved"
      ) {
        const cached = latestResolvedForUidRef.current.result;
        applyFirebaseResolution(candidateUser, cached);
        return cached;
      }

      if (isMountedRef.current) {
        setFirebaseUser(candidateUser);
        setIsResolvingIdentity(true);
      }

      const promise = customerIdentityService
        .resolveCustomerProfile(candidateUser)
        .then((result) => {
          latestResolvedForUidRef.current = {
            uid: targetUid,
            result,
          };
          applyFirebaseResolution(candidateUser, result);
          return result;
        })
        .finally(() => {
          if (inFlightResolutionRef.current && inFlightResolutionRef.current.uid === targetUid) {
            inFlightResolutionRef.current = null;
          }
          if (isMountedRef.current) {
            setIsResolvingIdentity(false);
          }
        });

      inFlightResolutionRef.current = {
        uid: targetUid,
        promise,
      };

      return promise;
    },
    [applyFirebaseResolution],
  );

  // Subscribe to Firebase Auth state changes on mount and clean up on unmount
  useEffect(() => {
    isMountedRef.current = true;

    // Synchronously restore mock session if present before Firebase listener emits (non-production modes only)
    if (authMode !== "production") {
      try {
        const currentMockUser = authService.getCurrentUser();
        if (
          currentMockUser &&
          customerIdentityService.isMockSessionUser(currentMockUser) &&
          !getAuxiliaryFirebaseUser()
        ) {
          apiClient.setLegacyCustomerSubcollectionsEnabled(false);
          setUser(currentMockUser);
          setSessionType("mock");
          setIsLoading(false);

          // Asynchronously revalidate and refresh mock session with authoritative backend data
          const currentMockId = currentMockUser.id || currentMockUser.userId;
          if (currentMockId) {
            authService
              .fetchUser(currentMockId)
              .then((fresh) => {
                if (isMountedRef.current && fresh && sessionTypeRef.current === "mock") {
                  setUser(fresh);
                }
              })
              .catch(() => {});
          }
        }
      } catch (err) {
        console.error("Failed to load mock user session:", err);
      }
    }

    let unsubscribe: () => void;

    if (authMode === "production") {
      // Live Production Auth: Subscribe via authManager to the isolated production Firebase Auth SDK instance
      unsubscribe = authManager.subscribeAuthState((prodUser) => {
        if (!isMountedRef.current) return;

        if (prodUser && prodUser.uid) {
          void resolveFirebaseUserInternal(prodUser).finally(() => {
            if (isMountedRef.current) {
              setIsLoading(false);
            }
          });
        } else {
          latestResolvedForUidRef.current = null;
          inFlightResolutionRef.current = null;
          setFirebaseUser(null);
          setIdentityResolution(null);
          apiClient.setLegacyCustomerSubcollectionsEnabled(false);
          setUser(null);
          setSessionType(null);
          setIsLoading(false);
        }
      });
    } else {
      // Local Emulator / Mock Auth: Subscribe via emailLinkAuthService / emulator auth
      unsubscribe = emailLinkAuthService.subscribeToAuthStateChanges((fbAuthUser) => {
        if (!isMountedRef.current) return;

        if (fbAuthUser && fbAuthUser.uid) {
          void resolveFirebaseUserInternal(fbAuthUser).finally(() => {
            if (isMountedRef.current) {
              setIsLoading(false);
            }
          });
        } else {
          latestResolvedForUidRef.current = null;
          inFlightResolutionRef.current = null;
          setFirebaseUser(null);
          setIdentityResolution(null);
          apiClient.setLegacyCustomerSubcollectionsEnabled(false);

          if (sessionTypeRef.current === "firebase") {
            setUser(null);
            setSessionType(null);
          } else {
            try {
              const mockUser = authService.getCurrentUser();
              if (mockUser && customerIdentityService.isMockSessionUser(mockUser)) {
                setUser(mockUser);
                setSessionType("mock");
              } else {
                setUser(null);
                setSessionType(null);
              }
            } catch {
              setUser(null);
              setSessionType(null);
            }
          }
          setIsLoading(false);
        }
      });
    }

    return () => {
      isMountedRef.current = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [authMode, resolveFirebaseUserInternal]);

  const login = async (phone: string, otp: string, referralCode?: string) => {
    setIsLoading(true);
    try {
      // Ensure any prior Firebase Auth session is signed out when starting a mock session
      if (firebaseUser || getAuxiliaryFirebaseUser() !== null) {
        await emailLinkAuthService.signOutFirebaseAuth();
      }
      latestResolvedForUidRef.current = null;
      inFlightResolutionRef.current = null;

      const loggedIn = await authService.verifyOtp(phone, otp, referralCode);
      if (isMountedRef.current) {
        apiClient.setLegacyCustomerSubcollectionsEnabled(false);
        setFirebaseUser(null);
        setIdentityResolution(null);
        setUser(loggedIn);
        setSessionType("mock");
      }
      return loggedIn;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    // If production auth mode is explicitly active, authenticate via Firebase Auth
    if (authManager.getMode() === "production") {
      setIsLoading(true);
      try {
        if (firebaseUser || getAuxiliaryFirebaseUser() !== null) {
          await emailLinkAuthService.signOutFirebaseAuth();
        }
        latestResolvedForUidRef.current = null;
        inFlightResolutionRef.current = null;
        authService.logout();

        const authUser = await authManager.loginWithEmail(email, password);
        const resolution = await resolveFirebaseUserInternal(authUser, { force: true });
        if (resolution.status === "resolved") {
          return resolution.profile;
        }
        throw new Error(
          resolution.message ||
            "Authenticated with Firebase, but no linked Sri Amman Smart Store customer profile was found.",
        );
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }

    setIsLoading(true);
    try {
      if (firebaseUser || getAuxiliaryFirebaseUser() !== null) {
        await emailLinkAuthService.signOutFirebaseAuth();
      }
      latestResolvedForUidRef.current = null;
      inFlightResolutionRef.current = null;

      const loggedIn = await authService.loginWithEmail(email, password);
      if (isMountedRef.current) {
        apiClient.setLegacyCustomerSubcollectionsEnabled(false);
        setFirebaseUser(null);
        setIdentityResolution(null);
        setUser(loggedIn);
        setSessionType("mock");
      }
      return loggedIn;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const loginWithFirebaseAuth = async (
    email: string,
    password: string,
  ): Promise<CustomerIdentityResolutionResult> => {
    setIsLoading(true);
    setIsResolvingIdentity(true);
    try {
      if (firebaseUser || emailLinkAuthService.getCurrentFirebaseAuthUser() !== null) {
        await emailLinkAuthService.signOutFirebaseAuth();
      }
      latestResolvedForUidRef.current = null;
      inFlightResolutionRef.current = null;
      authService.logout();

      const authUser = await authManager.loginWithEmail(email, password);
      return await resolveFirebaseUserInternal(authUser, { force: true });
    } finally {
      if (isMountedRef.current) {
        setIsResolvingIdentity(false);
        setIsLoading(false);
      }
    }
  };

  const completeEmailLinkSignIn = async (
    linkUrl: string,
    emailOverride?: string,
  ): Promise<CustomerIdentityResolutionResult> => {
    if (authManager.getMode() === "production") {
      throw new Error("Email-link sign-in is not enabled in the customer runtime.");
    }
    setIsLoading(true);
    setIsResolvingIdentity(true);
    try {
      const verifiedFirebaseUser = await emailLinkAuthService.completeSignInWithEmailLink(
        linkUrl,
        emailOverride,
      );
      return await resolveFirebaseUserInternal(verifiedFirebaseUser, {
        force: false,
      });
    } finally {
      if (isMountedRef.current) {
        setIsResolvingIdentity(false);
        setIsLoading(false);
      }
    }
  };

  const resolveFirebaseSession = async (
    overrideUser?: FirebaseEmailLinkAuthUser | AuthUserIdentity | null,
    options?: { force?: boolean },
  ): Promise<CustomerIdentityResolutionResult> => {
    const targetUser =
      overrideUser !== undefined
        ? overrideUser
        : (firebaseUser ?? getAuxiliaryFirebaseUser());
    return resolveFirebaseUserInternal(targetUser, options);
  };

  const validateReferralCode = async (code: string) => {
    return authService.validateReferralCode(code);
  };

  const logout = async () => {
    const prevId = user?.userId || user?.id;
    latestResolvedForUidRef.current = null;
    inFlightResolutionRef.current = null;

    authService.logout();
    apiClient.setLegacyCustomerSubcollectionsEnabled(false);
    notificationService.clearSessionState(prevId);

    if (isMountedRef.current) {
      setUser(null);
      setSessionType(null);
      setFirebaseUser(null);
      setIdentityResolution(null);
      setIsResolvingIdentity(false);
    }

    await authManager.signOut();
  };

  const refreshUser = useCallback(async () => {
    if (sessionType === "firebase" || firebaseUser) {
      const activeFbUser = firebaseUser ?? getAuxiliaryFirebaseUser();
      if (activeFbUser) {
        await resolveFirebaseUserInternal(activeFbUser, { force: true });
        return;
      }
    }

    const currentId = user?.id || user?.userId || authService.getCurrentUser()?.id;
    let updated: User | null = null;
    if (currentId) {
      updated = await authService.fetchUser(currentId);
    }
    if (!updated) {
      updated = authService.getCurrentUser();
    }
    if (isMountedRef.current) {
      setUser(updated);
      setSessionType(updated ? "mock" : null);
    }
  }, [sessionType, firebaseUser, resolveFirebaseUserInternal, user?.id, user?.userId]);

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;

    // Canonicalize Date of Birth: always use `dob`, never send `birthday`
    // Ensure phoneVerified cannot be set directly without trusted OTP verification
    const {
      uid: _ignoredInputUid,
      id: _ignoredId,
      userId: _ignoredUserId,
      birthday: inputBirthday,
      phoneVerified: _ignoredPhoneVerified,
      ...safeData
    } = data;
    const rawDob = data.dob ?? inputBirthday;
    const resolvedDob = normalizeDobString(rawDob);
    const isChangingPhone = Boolean(safeData.phone && user.phone && safeData.phone !== user.phone);
    const payload = {
      ...safeData,
      ...(resolvedDob !== null ? { dob: resolvedDob } : {}),
      ...(isChangingPhone ? { phoneVerified: false } : {}),
    };

    if (sessionType === "firebase" || authMode === "production" || authManager.getMode() === "production") {
      const endpoint = getCustomerProfileEndpoint(user.id);
      let updated: Partial<User> = payload;
      try {
        const patchResult = await apiClient.patch<User>(endpoint, payload);
        if (patchResult) {
          updated = patchResult;
        }
      } catch (patchErr) {
        console.warn("[AuthContext] Profile patch fallback to local state update:", patchErr);
      }
      const canonicalDob = updated.dob || resolvedDob || user.dob || user.birthday;
      const preserved: User = {
        ...user,
        ...updated,
        id: user.id,
        userId: user.userId || user.id,
        ...(isChangingPhone ? { phoneVerified: false } : {}),
        ...(canonicalDob ? { dob: canonicalDob, birthday: canonicalDob } : {}),
        ...(firebaseUser?.uid ? { uid: firebaseUser.uid } : user.uid ? { uid: user.uid } : {}),
      };
      if (isMountedRef.current) {
        setUser(preserved);
      }
      return;
    }

    const updated = await authService.updateProfile(user.id, payload);
    const canonicalDob = updated.dob || resolvedDob || user.dob || user.birthday;
    const updatedWithDob: User = {
      ...updated,
      ...(isChangingPhone ? { phoneVerified: false } : {}),
      ...(canonicalDob ? { dob: canonicalDob, birthday: canonicalDob } : {}),
    };
    if (isMountedRef.current) {
      setUser(updatedWithDob);
      setSessionType("mock");
    }
  };

  const identityNotice = describeIdentityResolutionState(identityResolution);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        sessionType,
        authMode,
        setAuthMode,
        authStatus: authManager.getStatus(),
        firebaseUser,
        identityResolution,
        identityNotice,
        isResolvingIdentity,
        login,
        loginWithEmail,
        loginWithFirebaseAuth,
        completeEmailLinkSignIn,
        resolveFirebaseSession,
        validateReferralCode,
        logout,
        refreshUser,
        updateProfile,
        testCredentials: TEST_CREDENTIALS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
