import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { EmailForm } from "@/components/auth/email-form";
import { OtpInput } from "@/components/auth/otp-input";
import { UserMenu } from "@/components/auth/user-menu";

const {
  sendVerificationOtpMock,
  verifyEmailMock,
  useSessionMock,
  signOutMock,
} = vi.hoisted(() => ({
  sendVerificationOtpMock: vi.fn(async () => ({ error: null })),
  verifyEmailMock: vi.fn(async () => ({ error: null })),
  useSessionMock: vi.fn(() => ({ data: null })),
  signOutMock: vi.fn(async () => ({ error: null })),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: {
      sendVerificationOtp: sendVerificationOtpMock,
      verifyEmail: verifyEmailMock,
    },
    useSession: useSessionMock,
    signOut: signOutMock,
  },
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: (namespace: string) => {
    const dictionaries: Record<string, Record<string, string>> = {
      auth: {
        email: "Email address",
        sendCode: "Send verification code",
      },
      common: {
        loading: "Loading...",
        error: "An error occurred",
      },
      nav: {
        signIn: "Sign in",
        signOut: "Sign out",
        profile: "Profile",
      },
    };

    return (key: string) => dictionaries[namespace]?.[key] ?? `${namespace}.${key}`;
  },
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({ children, href, ...props }: ComponentProps<"a">) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

describe("Auth UI", () => {
  it("EmailForm renders with email input", () => {
    const markup = renderToStaticMarkup(
      <EmailForm onSuccess={vi.fn()} />
    );

    expect(markup).toContain('type="email"');
  });

  it("OtpInput renders 6 input boxes", () => {
    const markup = renderToStaticMarkup(<OtpInput onChange={vi.fn()} value="" />);

    expect(markup.match(/<input/g)).toHaveLength(6);
  });

  it('UserMenu renders "Sign in" when not authenticated', () => {
    useSessionMock.mockReturnValue({ data: null });

    const markup = renderToStaticMarkup(<UserMenu />);

    expect(markup).toContain("Sign in");
  });
});
