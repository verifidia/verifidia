import Image from "next/image";
import logoImg from "../../../../public/logo.png";
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(210_100%_96%)_0,_transparent_42%),radial-gradient(circle_at_80%_85%,_hsl(213_80%_92%)_0,_transparent_30%)]" />
      <Card className="relative w-full max-w-[400px] border-blue-100/80 bg-card/95 backdrop-blur">
        <CardContent className="space-y-8 px-7 py-8">
          <div className="flex items-center justify-center gap-2 text-center">
            <Image src={logoImg} alt="Verifidia" width={32} height={32} />
            <p className="text-lg font-semibold tracking-tight">Verifidia</p>
          </div>
          {children}
        </CardContent>
      </Card>
    </main>
  );
}
