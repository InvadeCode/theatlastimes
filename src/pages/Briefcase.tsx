import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Article } from "../types";
import { useBriefcase } from "../lib/useBriefcase";

export default function Briefcase() {
  const { savedIds, removeArticle } = useBriefcase();
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (savedIds.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // Fetch all sequentially for simplicity or use a single request if the API supports it.
    // For now, fetch them one by one
    Promise.all(
      savedIds.map(id => fetch(`/api/news/${id}`).then(res => res.json()))
    )
    .then(results => {
       const articles = results.map(r => r.data).filter(Boolean) as Article[];
       setSavedArticles(articles);
       setLoading(false);
    })
    .catch(err => {
       console.error("Failed to load saved articles:", err);
       setLoading(false);
    });
  }, [savedIds]);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-0 py-12">
      <h1 className="text-4xl lg:text-5xl font-old-english font-black text-foreground mb-4">The Briefcase</h1>
      <p className="text-muted-foreground mb-12 uppercase tracking-widest text-xs font-bold">Your Saved Intelligence Reports</p>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Opening Briefcase...</div>
      ) : savedArticles.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border">
            <h2 className="text-2xl font-serif mb-4">Your Briefcase is Empty</h2>
            <p className="mb-6">Save articles to read them later.</p>
            <Link to="/" className="text-primary font-bold underline underline-offset-4">Browse Reports</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {savedArticles.map((article) => (
             <div key={article.id} className="group flex flex-col md:flex-row gap-6 border border-border p-6 hover:bg-muted/30 transition-colors relative">
                <button 
                  onClick={() => removeArticle(article.id)}
                  className="absolute top-4 right-4 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-destructive z-10"
                >
                  Remove
                </button>
                <Link to={`/article/${article.slug || article.id}`} className="flex-1 flex flex-col justify-center">
                  <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                     <span className="text-primary">{article.category}</span>
                     <span className="mx-2">•</span>
                     <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-serif text-xl lg:text-2xl font-bold mb-2 group-hover:underline decoration-primary underline-offset-4">
                    {article.title}
                  </h3>
                  <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                    {article.aiSummary}
                  </p>
                </Link>
             </div>
          ))}
        </div>
      )}
    </div>
  );
}
