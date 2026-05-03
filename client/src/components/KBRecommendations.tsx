import React from "react";
import { trpc } from "@/lib/trpc";
import { BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KBRecommendationsProps {
  articleId: number;
  onArticleSelect?: (articleId: number, title: string) => void;
}

/**
 * KB Recommendations Component
 * Shows related articles based on shared tags
 * Displayed in KB article modals for discoverability
 */
export const KBRecommendations: React.FC<KBRecommendationsProps> = ({
  articleId,
  onArticleSelect,
}) => {
  const { data: recommendations, isLoading } = trpc.kbBulkOperations.getRecommendedArticles.useQuery(
    { articleId, limit: 5 },
    { enabled: !!articleId }
  );

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-4 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-cyan-500" />
        <h3 className="text-sm font-semibold">Related Articles</h3>
      </div>

      <div className="space-y-2">
        {recommendations.map((rec: any) => (
          <button
            key={rec.id}
            onClick={() => onArticleSelect?.(rec.id, rec.title)}
            className="w-full text-left p-2 rounded hover:bg-muted transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-cyan-500 transition-colors">
                  {rec.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rec.category} • {rec.matchingTags} shared tags
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-500 flex-shrink-0 mt-0.5 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default KBRecommendations;
