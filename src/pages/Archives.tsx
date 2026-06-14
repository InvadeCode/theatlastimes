import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Article } from "../types";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Archives() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/news?limit=${page * 20}`)
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load archives:", err);
        setLoading(false);
      });
  }, [page]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-serif font-bold text-foreground mb-4">The Archives</h1>
      <p className="text-muted-foreground mb-12">Browse historical intelligence reports and comprehensive daily editions.</p>

      {loading && articles.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Retrieving archive data...</div>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => (
            <Link key={article.id} to={`/article/${article.slug || article.id}`}>
              <Card className="hover:bg-muted/50 transition-colors border-l-4 border-l-transparent hover:border-l-primary cursor-pointer mb-6 rounded-none">
                <CardContent className="p-6 flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                       <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                       <span className="mx-2">•</span>
                       <span className="text-primary">{article.category}</span>
                       <span className="mx-2">•</span>
                       <span>{article.region}</span>
                    </div>
                    <CardTitle className="font-serif text-xl mb-2 group-hover:underline">{article.title}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2">
                      {article.aiSummary || article.excerpt}
                    </CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          
          <div className="pt-8 flex justify-center">
             <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={loading} className="uppercase tracking-widest text-xs font-bold rounded-none">
                {loading ? "Loading..." : "Load Older Reports"}
             </Button>
          </div>
        </div>
      )}
    </div>
  );
}
