import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Article } from "../types";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function Archives() {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const limit = page * 40;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/news?limit=${limit}${debouncedSearch ? '&search='+encodeURIComponent(debouncedSearch) : ''}`)
      .then((res) => res.json())
      .then((data) => {
        setAllArticles(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load archives:", err);
        setLoading(false);
      });
  }, [limit, debouncedSearch]);

  const displayedArticles = allArticles;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-4xl lg:text-5xl font-old-english font-black text-foreground mb-4">The Archives</h1>
      <p className="text-muted-foreground mb-8 uppercase tracking-widest text-xs font-bold">Search historical intelligence reports and comprehensive daily editions.</p>

      {/* Archival Search */}
      <div className="relative mb-12 border-b-2 border-foreground/20 pb-8 focus-within:border-foreground transition-colors">
        <Search className="absolute left-0 top-3 w-6 h-6 text-muted-foreground" />
        <input 
           type="text"
           placeholder="Search by keyword, region, or topic..."
           className="w-full pl-10 pr-4 py-3 bg-transparent border-none text-xl font-serif text-foreground outline-none placeholder:text-muted-foreground/50"
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading && allArticles.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Retrieving archive data...</div>
      ) : (
        <div className="space-y-6">
          {displayedArticles.length === 0 ? (
             <div className="text-center py-10 font-serif text-lg">No reports found matching your query.</div>
          ) : (
             displayedArticles.map((article) => (
              <Link key={article.id} to={`/article/${article.slug || article.id}`}>
                <Card className="hover:bg-muted/30 transition-colors border-none border-t border-t-border cursor-pointer rounded-none shadow-none pb-4 pt-6 group">
                  <CardContent className="p-0 flex flex-col gap-2">
                    <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                       <span className="text-primary">{article.category}</span>
                       <span className="mx-2">•</span>
                       <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    </div>
                    <CardTitle className="font-serif text-xl group-hover:text-primary transition-colors">{article.title}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2 font-serif text-foreground/80 leading-relaxed mt-2">
                      {article.aiSummary || article.snippet}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
          
          <div className="pt-8 flex justify-center">
             <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={loading} className="uppercase tracking-widest text-xs font-bold rounded-none border-2">
                {loading ? "Loading..." : "Load Older Reports"}
             </Button>
          </div>
        </div>
      )}
    </div>
  );
}
