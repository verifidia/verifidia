import { getTranslations } from "next-intl/server";
import { SearchBar } from "@/components/layout/search-bar";

const steps = ["Search", "Generate", "Read"];
const trendingTopics = [
  "Quantum Computing",
  "CRISPR Gene Editing",
  "Climate Adaptation",
  "Ancient Mesopotamia",
  "Fusion Energy",
];

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <div className="space-y-14 py-8 sm:space-y-16 sm:py-12">
      <section className="mx-auto max-w-4xl space-y-6 text-center">
        <p className="text-primary text-sm font-semibold tracking-widest uppercase">{t("title")}</p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          The Open AI Encyclopedia
        </h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
          AI-generated articles with full transparency. Search any topic.
        </p>
        <SearchBar locale={locale} />
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step} className="bg-card rounded-xl border p-5">
              <p className="text-primary text-sm font-semibold">0{index + 1}</p>
              <h3 className="mt-2 text-lg font-medium">{step}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-2xl font-semibold tracking-tight">{t("trending")}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trendingTopics.map((topic) => (
            <li key={topic} className="bg-muted/35 rounded-lg border px-4 py-3 text-sm font-medium">
              {topic}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
