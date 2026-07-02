import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function AINews() {
  const { data, isLoading } = trpc.aiNews.listArticles.useQuery({
    limit: 50,
    offset: 0,
  });
  const [, setLocation] = useLocation();

  const articles = data?.articles || [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">AI News & Insights</h1>
          <p className="text-xl text-slate-300">
            Stay updated on the latest AI, cloud, and technology trends shaping the industry
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin w-8 h-8 text-cyan-500" />
          </div>
        ) : !articles || articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No articles available yet.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {articles.map((article: any) => (
              <div
                key={article.id}
                onClick={() => setLocation(`/ai-news/${article.id}`)}
                className="group cursor-pointer p-6 bg-slate-900 border border-slate-700 rounded-lg hover:border-cyan-500/50 transition"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full text-sm font-medium">
                      {article.category}
                    </span>
                    {article.source && (
                      <span className="text-slate-400 text-sm">
                        {article.source}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-sm flex-shrink-0">
                    {new Date(article.publishedAt || new Date()).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  </span>
                </div>

                <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-cyan-400 transition">
                  {article.title}
                </h2>

                {article.summary && (
                  <p className="text-slate-300 mb-4 line-clamp-2">
                    {article.summary}
                  </p>
                )}

                <div className="flex items-center gap-2 text-cyan-500 group-hover:gap-3 transition">
                  <span>Read more</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="bg-slate-900 border-t border-slate-800 py-12 mt-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-bold mb-4 text-white">
            Need AI guidance for your organization?
          </h3>
          <p className="text-slate-300 mb-6">
            Our AI experts can help you navigate the latest technologies and trends.
          </p>
          <button className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-8 py-3 rounded-lg transition">
            Schedule a Consultation
          </button>
        </div>
      </div>
    </div>
  );
}
