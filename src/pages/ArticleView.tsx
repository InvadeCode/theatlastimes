import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { Article } from "../types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import DOMPurify from 'isomorphic-dompurify';
import { Bookmark, BookmarkCheck, Printer, Edit, Trash2 } from "lucide-react";
import { useBriefcase } from "../lib/useBriefcase";

export default function ArticleView() {
  const { id } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { isSaved, saveArticle, removeArticle } = useBriefcase();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/news/${id}`)
      .then(res => res.json())
      .then(data => {
        setArticle(data.data);
        setLoading(false);
        if (data.data && (!data.data.keyPoints || data.data.keyPoints.length === 0 || data.data.tags?.includes("Unclassified") || data.data.keyPoints?.includes("Analysis failed or rate limited"))) {
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
        
        // Fetch related articles
        if (data.data && data.data.category) {
            fetch(`/api/news?category=${data.data.category}&limit=5`)
                .then(r => r.json())
                .then(relatedData => {
                    if (relatedData && relatedData.data) {
                        setRelated(relatedData.data.filter((a: Article) => a.id !== id).slice(0, 4));
                    }
                })
                .catch(console.error);
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="py-20 text-center font-serif text-xl animate-pulse">Decrypting Source File...</div>;
  if (!article) return <div className="py-20 text-center font-serif text-xl border-t border-border mt-10">Article Classified or Unavailable.</div>;
  
  const saved = isSaved(article.id);

  return (
    <article className="w-full max-w-[1800px] mx-auto space-y-10 py-8 px-4 lg:px-8">
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
       <div className="hidden print:block mb-8 border-b-4 border-double border-black pb-4">
           <h1 className="text-4xl font-old-english font-black text-black">The Atlas Times</h1>
           <div className="flex justify-between items-center text-xs uppercase font-bold tracking-widest mt-2 border-t border-black pt-2">
               <span>Printed: {new Date().toLocaleDateString()}</span>
               <span>Global Intelligence Archive</span>
           </div>
       </div>

       <h1 className="text-4xl md:text-6xl font-serif font-black leading-tight tracking-tight text-foreground print:text-5xl print:text-black">
         {article.title}
       </h1>
       
       <div className="w-full mt-8 flex flex-col group">
           <div className="w-full aspect-video md:aspect-[21/9] overflow-hidden border border-border relative">
               <img src={article.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80&fm=jpg&crop=entropy&cs=tinysrgb"} alt={article.title} className="w-full h-full object-cover grayscale" />
           </div>
           {(article.imageSource || article.imageCredit) && (
               <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2 text-right">
                   Image: {article.imageCredit && <span className="font-bold">{article.imageCredit} </span>}
                   {article.imageSource && <span>({article.imageSource})</span>}
               </div>
           )}
       </div>

       {/* Byline */}
       <div className="flex items-center justify-between py-6 border-y border-border mt-8">
          <div className="flex flex-col">
             <span className="font-medium text-sm">Source: <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline decoration-primary underline-offset-4">{article.sourceName}</a></span>
             <span className="text-xs text-muted-foreground mt-1">
                 {format(new Date(article.publishedAt), "MMMM do, yyyy 'at' h:mm a")} 
                 <span className="mx-2">&bull;</span>
                 Credibility Score: {article.credibilityScore}/100
             </span>
          </div>
          <div className="flex space-x-4 items-center">
             <Badge variant="outline" className="text-xs uppercase scale-90 hidden sm:inline-flex print:hidden">Analysis</Badge>
             <Link 
                 to={`/article/${id}/edit`}
                 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors print:hidden"
                 title="Edit Article"
             >
                 <Edit className="w-5 h-5" />
                 <span className="hidden sm:inline">Edit</span>
             </Link>
             <Link 
                 to={`/article/${id}/delete`}
                 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-red-600 transition-colors print:hidden"
                 title="Delete Article"
             >
                 <Trash2 className="w-5 h-5" />
                 <span className="hidden sm:inline">Delete</span>
             </Link>
             <button 
                 onClick={async () => {
                     try {
                         await navigator.clipboard.writeText(window.location.href);
                         alert("Link copied to clipboard. Make sure to paste it with https:// included!");
                     } catch (err) {
                         console.error("Failed to copy link", err);
                     }
                 }}
                 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors print:hidden"
                 title="Copy Link"
             >
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share-2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
                 <span className="hidden sm:inline">Share</span>
             </button>
             <button 
                 onClick={() => {
                     if (window.top !== window.self) {
                         // Inside iframe: alert user to use standard pop-out
                         alert("To print, please open this app in a new tab first using the 'Open in new tab' button at the top right of the preview pane.");
                     } else {
                         window.print();
                     }
                 }}
                 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors print:hidden group relative"
                 title="Print Article"
             >
                 <Printer className="w-5 h-5" />
                 <span className="hidden sm:inline">Print</span>
                 
                 {/* Tooltip for iframe users */}
                 <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white text-[10px] py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded">
                     Use the top-right button to open in a new tab first
                 </div>
             </button>
             <button 
                 onClick={() => saved ? removeArticle(article.id) : saveArticle(article.id)}
                 className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors ${saved ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
             >
                 {saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                 <span className="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
             </button>
          </div>
       </div>

       {/* AI Summary Section - Premium Look */}
       <div className="bg-muted/30 border-l-4 border-primary p-6 md:p-10 rounded shadow-sm print:hidden">
           <div className="flex items-center space-x-2 mb-6">
              <div className="w-4 h-4 bg-primary text-primary-foreground flex items-center justify-center rounded-sm">
                 <div className="w-1.5 h-1.5 bg-background rounded-full"></div>
              </div>
              <h3 className="font-sans font-bold uppercase tracking-wider text-sm opacity-80">AI generated Summary</h3>
           </div>
           
           {article.detailedHumanizedSummary ? (
               <div className="font-serif text-lg md:text-xl leading-relaxed text-foreground opacity-90 mb-8 max-w-none prose prose-p:mb-4">
                   {article.detailedHumanizedSummary.split('\n').map((paragraph, idx) => (
                       <p key={idx}>{paragraph}</p>
                   ))}
               </div>
           ) : (
               <p className="font-serif text-xl md:text-2xl leading-relaxed text-foreground opacity-90 mb-8">
                   {article.aiSummary}
               </p>
           )}

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
       <div className="article-content py-8 border-y border-border [&>p]:mb-6 [&>p]:font-serif [&>p]:text-xl [&>p]:leading-relaxed [&>p]:text-foreground/90 [&>h1]:text-4xl [&>h1]:font-bold [&>h1]:mt-10 [&>h1]:mb-4 [&>h1]:font-serif [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:font-serif [&>h3]:text-2xl [&>h3]:font-bold [&>h3]:mt-6 [&>h3]:mb-4 [&>h3]:font-serif [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>ul>li]:mb-2 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6 [&>ol>li]:mb-2 [&_strong]:font-black"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.fullContent || "<p>Full content unavailable in feed.</p>") }}
       />

       {/* Context & Outbound */}
       {!article.id.startsWith('editorial-') && article.originalUrl !== '#' && (
       <div className="py-10 text-center flex flex-col items-center print:hidden">
          <p className="text-sm text-muted-foreground italic mb-6 max-w-2xl px-4 border border-border bg-card py-3">
             This summary was generated using AI from publicly available source metadata and linked references. Read the full story from the original publisher.
          </p>
          <a href={article.originalUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-primary text-primary-foreground px-8 py-4 font-bold uppercase tracking-wider text-sm hover:opacity-90 shadow-sm transition-colors rounded-none">
              Read Full Story on {article.sourceName}
          </a>
       </div>
       )}

       {/* Tags */}
       <div className="border-t border-border pt-6 flex flex-wrap gap-2 text-xs print:hidden">
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

       {/* Related Reports */}
       {related.length > 0 && (
         <div className="mt-16 pt-12 border-t-[6px] border-double border-border pb-12 print:hidden">
            <h2 className="text-3xl font-old-english font-bold mb-8 text-foreground text-center">Related Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {related.map(rel => (
                    <Link key={rel.id} to={`/article/${rel.id}`} className="group flex flex-col border border-border bg-card hover:bg-muted/30 transition-colors p-4">
                       <span className="text-[10px] text-primary uppercase font-bold tracking-widest mb-2">{rel.category}</span>
                       <h3 className="font-serif font-bold text-lg mb-2 group-hover:underline text-foreground leading-snug">{rel.title}</h3>
                       <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed">{rel.aiSummary}</p>
                    </Link>
                ))}
            </div>
         </div>
       )}
    </article>
  );
}
