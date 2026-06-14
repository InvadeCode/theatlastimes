import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { Article } from "../types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DOMPurify from 'isomorphic-dompurify';

export default function ArticleView() {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/news/${id}`)
      .then(res => res.json())
      .then(data => {
        setArticle(data.data);
        setLoading(false);
        if (data.data && data.data.tags && data.data.tags.includes("Unclassified")) {
            // Trigger AI Analysis in background
            fetch(`/api/news/${id}/analyze`, { method: "POST" })
                .then(r => r.json())
                .then(analyzedData => {
                    if (analyzedData && analyzedData.data) {
                       setArticle(analyzedData.data);
                    }
                })
                .catch(console.error);
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-20 text-center font-serif text-xl animate-pulse">Decrypting Source File...</div>;
  if (!article) return <div className="py-20 text-center font-serif text-xl border-t border-border mt-10">Article Classified or Unavailable.</div>;

  return (
    <article className="max-w-5xl mx-auto space-y-10 py-8">
       <Helmet>
           <title>{article.title} - The Atlas Times</title>
           <meta name="description" content={article.aiSummary?.substring(0, 160) || "Read the latest global intelligence report on The Atlas Times."} />
           <meta property="og:title" content={`${article.title} | Premium Briefing`} />
           <meta property="og:description" content={article.aiSummary?.substring(0, 160)} />
           <meta property="og:type" content="article" />
           <meta name="twitter:card" content="summary" />
           <meta name="twitter:title" content={article.title} />
           <meta name="twitter:description" content={article.aiSummary?.substring(0, 160)} />
       </Helmet>

       {/* Meta */}
       <div className="flex items-center space-x-3 text-xs uppercase tracking-widest font-bold">
           <Link to={`/category/${article.category.toLowerCase()}`} className="text-primary hover:underline">{article.category}</Link>
           <span className="text-muted-foreground">&bull;</span>
           <span className="text-muted-foreground">{article.region}</span>
       </div>

       {/* Title */}
       <h1 className="text-4xl md:text-6xl font-serif font-black leading-tight tracking-tight text-foreground">
         {article.title}
       </h1>

       {/* Byline */}
       <div className="flex items-center justify-between py-6 border-y border-border">
          <div className="flex flex-col">
             <span className="font-medium text-sm">Source: <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline decoration-primary underline-offset-4">{article.sourceName}</a></span>
             <span className="text-xs text-muted-foreground mt-1">
                 {format(new Date(article.publishedAt), "MMMM do, yyyy 'at' h:mm a")} 
                 <span className="mx-2">&bull;</span>
                 Credibility Score: {article.credibilityScore}/100
             </span>
          </div>
          <div className="flex space-x-2">
             <Badge variant="outline" className="text-xs uppercase scale-90">Analysis</Badge>
          </div>
       </div>

       {/* AI Summary Section - Premium Look */}
       <div className="bg-muted/30 border-l-4 border-primary p-6 md:p-10 rounded shadow-sm">
           <div className="flex items-center space-x-2 mb-6">
              <div className="w-4 h-4 bg-primary text-primary-foreground flex items-center justify-center rounded-sm">
                 <div className="w-1.5 h-1.5 bg-background rounded-full"></div>
              </div>
              <h3 className="font-sans font-bold uppercase tracking-wider text-sm opacity-80">AI generated Summary</h3>
           </div>
           
           <p className="font-serif text-xl md:text-2xl leading-relaxed text-foreground opacity-90 mb-8">
               {article.aiSummary}
           </p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-t border-border/50 pt-8 mt-8">
               <div>
                   <h4 className="font-bold text-sm uppercase tracking-wider mb-4 border-b border-border/50 pb-2">Key Operational Points</h4>
                   <ul className="space-y-3 font-serif text-muted-foreground list-disc pl-5">
                       {article.keyPoints?.map((pt, i) => (
                           <li key={i} className="leading-relaxed">{pt}</li>
                       ))}
                       {(!article.keyPoints || article.keyPoints.length === 0) && (
                           <li className="leading-relaxed italic">Awaiting AI extraction...</li>
                       )}
                   </ul>
               </div>
               <div>
                   <h4 className="font-bold text-sm uppercase tracking-wider mb-4 border-b border-border/50 pb-2">Why It Matters</h4>
                   <p className="font-serif text-muted-foreground leading-relaxed">
                       {article.whyItMatters || "Awaiting advanced contextual analysis from AI models."}
                   </p>
               </div>
           </div>
       </div>

       {/* Full Article Content */}
       <div className="article-content py-8 border-y border-border [&>p]:mb-6 [&>p]:font-serif [&>p]:text-xl [&>p]:leading-relaxed [&>p]:text-foreground/90 [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:font-serif"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.fullContent || "<p>Full content unavailable in feed.</p>") }}
       />

       {/* Context & Outbound */}
       <div className="py-10 text-center flex flex-col items-center">
          <p className="text-sm text-muted-foreground italic mb-6 max-w-2xl px-4 border border-border bg-card py-3">
             This summary was generated using AI from publicly available source metadata and linked references. Read the full story from the original publisher.
          </p>
          <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-primary text-primary-foreground px-8 py-4 font-bold uppercase tracking-wider text-sm hover:opacity-90 shadow-sm transition-colors rounded-none">
              Read Full Story on {article.sourceName}
          </a>
       </div>

       {/* Tags */}
       <div className="border-t border-border pt-6 flex flex-wrap gap-2 text-xs">
          <span className="font-bold uppercase tracking-widest mr-2 py-1">Tags:</span>
          {article.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="uppercase">{tag}</Badge>
          ))}
          {article.sentiment && (
              <Badge variant="outline" className={`uppercase ${article.sentiment === 'positive' ? 'border-green-500 text-green-700' : article.sentiment === 'negative' ? 'border-red-500 text-red-700' : 'border-yellow-500 text-yellow-700'}`}>
                 {article.sentiment}
              </Badge>
          )}
       </div>
    </article>
  );
}
