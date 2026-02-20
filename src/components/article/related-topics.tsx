import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Search } from "lucide-react";

interface RelatedTopic {
  name: string;
  slug: string;
  cached: boolean;
}

interface RelatedTopicsProps {
  topics: RelatedTopic[];
  locale: string;
}

export function RelatedTopics({ topics, locale }: RelatedTopicsProps) {
  if (topics.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Related Topics</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {topics.map(topic => (
            <li key={topic.name}>
              {topic.cached ? (
                <Link
                  href={`/${locale}/article/${topic.slug}`}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <BookOpen className="h-3 w-3 flex-shrink-0" />
                  {topic.name}
                  <Badge variant="outline" className="text-xs ml-auto">Article</Badge>
                </Link>
              ) : (
                <Link
                  href={`/${locale}/search?q=${encodeURIComponent(topic.name)}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Search className="h-3 w-3 flex-shrink-0" />
                  {topic.name}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
