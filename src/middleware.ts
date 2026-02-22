import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    "/",
    "/(en|es|fr|de|zh|ja|ko|pt|ar|hi)/:path*",
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};
