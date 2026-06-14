import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { Article } from "../types";

export default function Feed() {
  const { id } = useParams();
  const location = useLocation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const isRegion = location.pathname.includes("/region/");
  const title = (id === "global" || id === "feed") ? "Global News" : (isRegion ? `${id?.toUpperCase()} REGION` : `${id?.toUpperCase()}`);

  useEffect(() => {
    setLoading(true);
    const query = isRegion ? `?region=${id}&limit=50` : `?category=${id}&limit=50`;
    const endpoint = (id === "global" || id === "feed") ? `/api/news?limit=50` : `/api/news${query}`;
    
    fetch(endpoint)
      .then(res => res.json())
      .then(data => {
         setArticles(data.data || []);
         setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, isRegion]);

  if (loading) return <div className="py-32 text-center font-serif text-xl animate-pulse text-muted-foreground">Gathering Intelligence...</div>;

  const heroArticle = articles.length > 0 ? articles[0] : null;
  const gridArticles = articles.slice(1);

  return (
    <div className="w-full bg-background mb-16">
      <div className="py-12 text-center border-b border-border mb-12">
          <h1 className="text-5xl md:text-7xl font-old-english font-bold capitalize tracking-normal text-foreground">{title}</h1>
          <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Latest reports and analysis</p>
      </div>
      
      {articles.length === 0 ? (
        <div className="text-muted-foreground font-serif text-center py-10 text-xl">No active reports in this sector.</div>
      ) : (
        <div className="flex flex-col gap-12">
            
            {/* Top Category Story */}
            {heroArticle && (
                <Link to={`/article/${heroArticle.id}`} className="group grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-b border-border pb-12">
                    <div className="flex flex-col justify-center">
                        <span className="text-[10px] text-primary uppercase font-bold tracking-wider mb-4 border border-primary px-2 py-1 w-fit">{heroArticle.region}</span>
                        <h2 className="font-serif font-black text-4xl mb-6 leading-tight group-hover:text-primary transition-colors">{heroArticle.title}</h2>
                        <p className="text-lg font-serif text-muted-foreground leading-relaxed mb-6 border-l-4 border-primary pl-4">{heroArticle.aiSummary}</p>
                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            <span>{heroArticle.sourceName}</span>
                            <span>&bull;</span>
                            <span>{formatDistanceToNow(new Date(heroArticle.publishedAt))} ago</span>
                        </div>
                    </div>
                </Link>
            )}

            {/* Denser Lower Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
               {gridArticles.map((article) => (
                   <Link to={`/article/${article.id}`} key={article.id} className="group flex flex-col">
                       <span className="text-[10px] text-primary uppercase tracking-widest font-bold mb-2">{isRegion ? article.category : article.region}</span>
                       <h3 className="font-serif font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">{article.title}</h3>
                       <p className="text-xs text-muted-foreground line-clamp-3 mb-4">{article.aiSummary}</p>
                       <span className="text-[10px] mt-auto font-bold text-muted-foreground uppercase">{formatDistanceToNow(new Date(article.publishedAt))} ago</span>
                   </Link>
               ))}
            </div>
            
        </div>
      )}
    </div>
  )
}
