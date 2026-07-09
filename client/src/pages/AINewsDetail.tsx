import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { Streamdown } from "@/components/GigitekMarkdown";
import { useEffect, useState } from "react";

export default function AINewsDetail() {
  const [, setLocation] = useLocation();
  const [articleId, setArticleId] = useState<number | null>(null);

  // Parse ID from URL
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/\/ai-news\/(\d+)/);
    if (match) {
      setArticleId(parseInt(match[1]));
    }
  }, []);

  const { data, isLoading, error } = trpc.aiNews.getArticle.useQuery(
    { id: articleId || 0 },
    { enabled: !!articleId }
  );

  const article = data?.article;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-cyan-500" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Article Not Found</h1>
          <button
            onClick={() => setLocation("/ai-news")}
            className="text-cyan-500 hover:text-cyan-400 underline"
          >
            Back to AI News
          </button>
        </div>
      </div>
    );
  }

  // Parse keyTakeaways if it's a JSON string
  let takeaways: string[] = [];
  if (article.keyTakeaways) {
    try {
      takeaways = typeof article.keyTakeaways === "string"
        ? JSON.parse(article.keyTakeaways)
        : Array.isArray(article.keyTakeaways)
        ? article.keyTakeaways
        : [];
    } catch {
      takeaways = [];
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-background border-b border-slate-800 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <button
            onClick={() => setLocation("/ai-news")}
            className="text-cyan-500 hover:text-cyan-400 mb-6 flex items-center gap-2"
          >
            ← Back to AI News
          </button>

          <div className="flex items-center gap-3 mb-4">
            <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-sm font-medium">
              {article?.category}
            </span>
            {article?.source && (
              <span className="text-slate-400 text-sm">
                Source: {article?.source}
              </span>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            {article?.title}
          </h1>

          <div className="flex items-center gap-4 text-slate-400 text-sm">
            <span>
              {new Date(article?.publishedAt || new Date()).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}
            </span>
            <span>•</span>
            <span>By GigitekAI Team</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Summary */}
        {article?.summary && (
          <div className="mb-12 p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
            <p className="text-lg text-slate-200 leading-relaxed">
              {article?.summary}
            </p>
          </div>
        )}

        {/* Key Takeaways */}
        {takeaways.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400">
              Key Takeaways
            </h2>
            <ul className="space-y-3">
              {takeaways.map((takeaway: string, idx: number) => (
                <li key={idx} className="flex gap-3">
                  <span className="text-cyan-500 font-bold flex-shrink-0">
                    •
                  </span>
                  <span className="text-slate-300">{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Full Content */}
        <div className="prose prose-invert max-w-none">
          <div className="text-slate-300 leading-relaxed space-y-6">
            <Streamdown>{article?.content || article?.summary || ""}</Streamdown>
          </div>
        </div>

        {/* Metadata */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-slate-500 mb-1">Category</p>
              <p className="text-foreground font-medium">{article?.category}</p>
            </div>
            {article?.source && (
              <div>
                <p className="text-slate-500 mb-1">Source</p>
                <p className="text-foreground font-medium">{article?.source}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-slate-900/50 border-t border-slate-800 py-12 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Ready to transform your business?
          </h3>
          <p className="text-slate-400 mb-6">
            Let's discuss how GigitekAI can help you achieve your cloud and AI goals.
          </p>
          <button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-8 py-3 rounded-lg transition">
            Get in Touch
          </button>
        </div>
      </div>
    </div>
  );
}
