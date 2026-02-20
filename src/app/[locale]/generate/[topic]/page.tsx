import { GenerationStream } from "@/components/article/generation-stream";

type GenerationPageProps = {
  params: Promise<{
    locale: string;
    topic: string;
  }>;
};

export default async function GenerateTopicPage({ params }: GenerationPageProps) {
  const { topic } = await params;
  const decodedTopic = decodeURIComponent(topic).replace(/-/g, " ");

  return <GenerationStream topic={decodedTopic} />;
}
