"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "User";
  const words = source.split(/\s+/).slice(0, 2);
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("") || "U";
}

export function UserMenu() {
  const locale = useLocale();
  const navT = useTranslations("nav");
  const { data: session } = authClient.useSession();

  const initials = useMemo(
    () => getInitials(session?.user?.name, session?.user?.email),
    [session?.user?.email, session?.user?.name]
  );

  if (!session?.user) {
    return (
      <Button asChild>
        <Link href="/auth/sign-in">{navT("signIn")}</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={navT("profile")}
          className="inline-flex size-9 items-center justify-center rounded-full border border-border bg-secondary text-sm font-semibold text-secondary-foreground shadow-xs transition-colors hover:bg-secondary/80"
          type="button"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="space-y-1">
          <p className="text-xs text-muted-foreground">{session.user.email}</p>
          <p className="font-medium">{session.user.name || navT("profile")}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/auth/profile">{navT("profile")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void (async () => {
              await authClient.signOut();
              window.location.assign(`/${locale}/auth/sign-in`);
            })();
          }}
          variant="destructive"
        >
          {navT("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
