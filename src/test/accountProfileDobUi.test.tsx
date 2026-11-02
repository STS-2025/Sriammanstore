import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AccountPage } from "../routes/account";
import type { User } from "../types";

// Mock router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: any) => opts,
  useSearch: () => ({}),
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
}));

// Mock layout components
vi.mock("../components/layout/StoreHeader", () => ({
  StoreHeader: () => <div data-testid="store-header">StoreHeader</div>,
}));
vi.mock("../components/layout/BottomNav", () => ({
  BottomNav: () => <div data-testid="bottom-nav">BottomNav</div>,
}));
vi.mock("../components/layout/StoreFooter", () => ({
  StoreFooter: () => <div data-testid="store-footer">StoreFooter</div>,
}));

// Mock services called by AccountPage
vi.mock("../services/orderService", () => ({
  orderService: {
    getOrders: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock("../services/addressService", () => ({
  addressService: {
    getAddresses: vi.fn().mockResolvedValue([]),
    addAddress: vi.fn().mockResolvedValue({}),
    updateAddress: vi.fn().mockResolvedValue({}),
    deleteAddress: vi.fn().mockResolvedValue({}),
    setDefaultAddress: vi.fn().mockResolvedValue({}),
  },
}));
vi.mock("../services/wishlistService", () => ({
  wishlistService: {
    getWishlist: vi.fn().mockResolvedValue([]),
    getWishlistProducts: vi.fn().mockResolvedValue([]),
  },
}));
vi.mock("../services/coinService", () => ({
  coinService: {
    getBalance: vi.fn().mockResolvedValue(100),
    getUserCoins: vi.fn().mockResolvedValue(100),
    getHistory: vi.fn().mockResolvedValue([]),
    calculateVIPStatus: vi.fn().mockReturnValue({
      isVIP: false,
      rollingSpend: 0,
      threshold: 5000,
      percentage: 0,
      daysRemaining: 30,
    }),
  },
  convertCoinsToRupees: (coins: number) => Math.floor(coins / 10),
}));
vi.mock("../services/notificationService", () => ({
  notificationService: {
    getNotifications: vi.fn().mockResolvedValue([]),
    getUnreadCount: vi.fn().mockResolvedValue(0),
  },
}));
vi.mock("../services/settingsService", () => ({
  settingsService: {
    getStoreInfo: vi.fn().mockResolvedValue({}),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock Contexts
let mockUser: User | null = null;
const mockUpdateProfile = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    isResolvingIdentity: false,
    logout: vi.fn(),
    updateProfile: mockUpdateProfile,
    refreshUser: vi.fn(),
  }),
}));

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    language: "en",
    toggleLanguage: vi.fn(),
    t: (en: string, _ta?: string) => en,
  }),
}));

describe("Account Profile Page & Edit Modal DOB Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      id: "SASS0000001",
      userId: "SASS0000001",
      name: "Lakshmi Narayanan",
      phone: "+91 98427 12345",
      email: "lakshmi@example.com",
      coins: 320,
      isVIP: true,
      referralCode: "SASS0000001",
      createdAt: "2024-01-01T00:00:00.000Z",
      dob: "1990-05-14",
    };
  });

  it("displays the canonical dob on the account profile page", () => {
    render(<AccountPage />);

    const dobDisplay = screen.getByTestId("profile-dob-display");
    expect(dobDisplay).toBeInTheDocument();
    expect(dobDisplay).toHaveTextContent("1990-05-14");
  });

  it("initializes the Edit Profile modal birthday input from user.dob", async () => {
    render(<AccountPage />);

    // Click "Edit Info" button
    const editBtn = screen.getByTestId("open-edit-profile-btn");
    fireEvent.click(editBtn);

    // Verify modal is open and birthday input is populated from user.dob
    const birthdayInput = await screen.findByTestId("edit-profile-birthday-input");
    expect(birthdayInput).toBeInTheDocument();
    expect((birthdayInput as HTMLInputElement).value).toBe("1990-05-14");
  });

  it("submits the updated birthday as 'dob' in the updateProfile payload without creating 'birthday'", async () => {
    mockUpdateProfile.mockResolvedValueOnce(undefined);

    render(<AccountPage />);

    // Open modal
    const editBtn = screen.getByTestId("open-edit-profile-btn");
    fireEvent.click(editBtn);

    const birthdayInput = await screen.findByTestId("edit-profile-birthday-input");

    // Change birthday to a new date
    fireEvent.change(birthdayInput, { target: { value: "1992-08-21" } });

    // Submit form
    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
    });

    const firstCall = mockUpdateProfile.mock.calls[0];
    expect(firstCall).toBeDefined();
    const payload = firstCall![0] as Partial<User>;

    // 1. Verify dob is set to the new value
    expect(payload.dob).toBe("1992-08-21");

    // 2. Verify birthday field is strictly absent
    expect("birthday" in payload).toBe(false);
    expect(payload.birthday).toBeUndefined();
  });

  it("does not send dob when saving profile if birthday was left empty or untouched", async () => {
    mockUpdateProfile.mockResolvedValueOnce(undefined);

    render(<AccountPage />);

    // Open modal
    const editBtn = screen.getByTestId("open-edit-profile-btn");
    fireEvent.click(editBtn);

    const nameInput = screen.getByDisplayValue("Lakshmi Narayanan");
    fireEvent.change(nameInput, { target: { value: "Lakshmi N." } });

    // Clear birthday input
    const birthdayInput = screen.getByTestId("edit-profile-birthday-input");
    fireEvent.change(birthdayInput, { target: { value: "" } });

    // Submit
    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledTimes(1);
    });

    const firstCall = mockUpdateProfile.mock.calls[0];
    expect(firstCall).toBeDefined();
    const payload = firstCall![0] as Partial<User>;
    expect(payload.name).toBe("Lakshmi N.");
    // An empty birthday should not overwrite or send empty dob
    expect("dob" in payload).toBe(false);
    expect("birthday" in payload).toBe(false);
  });
});
