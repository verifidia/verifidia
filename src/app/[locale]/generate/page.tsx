import { redirect } from "@/i18n/routing";

type GeneratePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function GeneratePage({ params }: GeneratePageProps) {
  const { locale } = await params;
  redirect({ href: "/search", locale });
}
