import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { Article, AI_Briefing } from "../types";

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [popular, setPopular] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/news?limit=75").then(res => res.json())
    ]).then(([newsRes]) => {
      setArticles(newsRes.data || []);
      // For demo, sort by relevanceScore for popular
      const pop = [...(newsRes.data || [])].sort((a,b) => b.importanceScore - a.importanceScore);
      setPopular(pop);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="py-20 text-center font-serif text-xl animate-pulse text-muted-foreground">Gathering Intelligence...</div>;
  }

  const topStrip = articles.slice(0, 4);
  const freshStories = articles.slice(4, 9);
  const heroArticle = articles[9];
  const popularStories = popular.slice(0, 5);
  
  const breakingNews = articles.filter(a => a.importanceScore > 85).slice(0, 4);

  const filterAndPad = (predicate: (a: Article) => boolean, count: number) => {
      const filtered = articles.filter(predicate);
      if (filtered.length >= count) return filtered.slice(0, count);
      let res = [...filtered];
      for(let a of articles) {
          if (res.length >= count) break;
          if (!res.find(x => x.id === a.id)) res.push(a);
      }
      return res;
  };

  const geopolitics = filterAndPad(a => a.category === "Geopolitics" || a.category === "Global", 4);
  const techPolicy = filterAndPad(a => a.category === "Tech Policy" || a.category === "Security", 3);
  const economy = filterAndPad(a => a.category === "Economy" || a.category === "Trade", 5);
  const climateStories = filterAndPad(a => a.category === "Climate" || a.category === "Environment" || a.category === "Science", 4);
  const globalMarkets = filterAndPad(a => a.category === "Finance" || a.category === "Business" || a.category === "Markets", 6);

  // Collect the rendered IDs to avoid showing them again
  const renderedIds = new Set([
      ...topStrip.map(a => a.id),
      ...freshStories.map(a => a.id),
      heroArticle?.id,
      ...popularStories.map(a => a.id),
      ...breakingNews.map(a => a.id),
      ...geopolitics.map(a => a.id),
      ...techPolicy.map(a => a.id),
      ...economy.map(a => a.id),
      ...climateStories.map(a => a.id),
      ...globalMarkets.map(a => a.id)
  ].filter(Boolean));

  const moreStoriesUnfiltered = articles.filter(a => !renderedIds.has(a.id)).concat(articles.slice(12)); // Fallback if no purely unread exist
  const moreStories = Array.from(new Map(moreStoriesUnfiltered.map(item => [item.id, item])).values()) as Article[];

  return (
    <div className="flex flex-col gap-0 bg-background text-foreground">
        
      {/* Top Story Strip */}
      <div className="hidden lg:grid grid-cols-4 gap-4 py-4 border-b border-border mb-8">
         {topStrip.map(article => (
            <Link to={`/article/${article.id}`} key={article.id} className="group flex flex-col gap-2 relative pl-4 border-l border-border hover:opacity-80 transition-opacity">
                {article.importanceScore > 85 && (
                   <span className="text-primary text-[9px] uppercase font-bold tracking-widest">Exclusive</span>
                )}
                <h4 className="font-serif font-bold text-sm leading-snug text-foreground group-hover:text-primary transition-colors">{article.title}</h4>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground flex gap-2">
                   <span className="text-primary font-bold">{article.category}</span>
                   <span>{format(new Date(article.publishedAt), 'MMM d, yyyy')}</span>
                </div>
            </Link>
         ))}
      </div>

      {/* Main Editorial Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Left Column: Fresh Stories */}
          <section className="col-span-1 lg:col-span-3 flex flex-col pt-2">
              <h2 className="text-4xl font-old-english font-bold mb-1">Fresh stories</h2>
              <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-6 leading-relaxed">Today: Browse our editor's hand-picked articles!</p>
              
              <div className="flex flex-col gap-5">
                 {freshStories.map((article, idx) => (
                    <div key={article.id} className="border-b border-border pb-5 last:border-0">
                        {idx === 1 && (
                            <span className="bg-primary text-primary-foreground text-[8px] uppercase font-bold px-1.5 py-0.5 mb-2 inline-block shadow-sm">Exclusive</span>
                        )}
                        <Link to={`/article/${article.id}`}>
                            <h3 className="font-serif font-bold text-base leading-snug hover:text-primary transition-colors mb-2 text-foreground/90">{article.title}</h3>
                        </Link>
                        <div className="text-[9px] uppercase tracking-widest text-primary font-bold flex gap-2">
                            <span>{article.category}</span>
                            <span className="text-muted-foreground font-normal">{format(new Date(article.publishedAt), 'MMM d, yyyy')}</span>
                        </div>
                    </div>
                 ))}
                 <div className="flex gap-4 text-muted-foreground mt-2">
                    <button className="hover:text-primary transition-colors">&larr;</button>
                    <button className="hover:text-primary transition-colors">&rarr;</button>
                 </div>
              </div>
          </section>

          {/* Center Column: Featured Hero & Secondary */}
          <section className="col-span-1 lg:col-span-6 flex flex-col pl-4">
              {heroArticle && (
                  <Link to={`/article/${heroArticle.id}`} className="group relative w-full mb-8 overflow-hidden bg-background">
                      {heroArticle.imageUrl && (
                          <div className="w-full aspect-[4/3] md:aspect-[5/4] bg-muted mb-4">
                              <img src={heroArticle.imageUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
                          </div>
                      )}
                      <div className="flex flex-col p-2">
                          <span className="bg-primary text-primary-foreground text-[10px] uppercase font-bold px-1.5 py-0.5 w-fit mb-3 shadow-sm">{heroArticle.category}</span>
                          <h2 className="text-foreground font-serif font-black text-3xl md:text-5xl leading-tight mb-4 group-hover:text-primary transition-colors tracking-tight">
                              {heroArticle.title}
                          </h2>
                          <p className="text-muted-foreground text-lg font-serif line-clamp-3 w-full md:w-11/12 leading-relaxed">
                              {heroArticle.aiSummary}
                          </p>
                      </div>
                  </Link>
              )}
          </section>

          {/* Right-Middle Stacked Stories + Far Right Popular merged conceptually or separated */}
          {/* We will do 2 cols for Center (Hero=6, Popular=3). So we need Secondary stories somewhere. */}
          {/* Wait, layout is 3 + 6 + 3 = 12. Let's put Secondary inside the 6-col section below hero, or make Hero 4 and Secondary 2? */}
          {/* Actually the image has 4 visual columns: 1. List 2. Hero 3. Two stacked images 4. Popular List. */}
          {/* Hero is 2/4 maybe, wait that's not possible in 4 col if hero is 2 cols. Let's just put secondary next to popular. */}
          
          <section className="col-span-1 lg:col-span-3 flex flex-col pl-4">
             <div className="bg-background relative">
                 <h2 className="text-4xl font-old-english font-bold mb-6">Popular</h2>
                 
                 {popularStories.map((article, idx) => (
                    <div key={article.id} className="mb-6 last:mb-0 border-b border-border pb-6 last:border-0 group">
                        {idx === 0 && article.imageUrl ? (
                           <Link to={`/article/${article.id}`} className="block w-full aspect-[16/9] mb-4 bg-muted overflow-hidden">
                               <img src={article.imageUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                           </Link>
                        ) : null}
                        <Link to={`/article/${article.id}`}>
                            {idx === 3 && (
                                <span className="bg-primary text-primary-foreground text-[8px] uppercase font-bold px-1.5 py-0.5 mb-2 inline-block shadow-sm">Exclusive</span>
                            )}
                            <div className="text-[9px] uppercase tracking-widest text-primary font-bold mb-1">{article.category}</div>
                            <h3 className="font-serif font-bold text-base leading-snug group-hover:text-primary transition-colors mb-2 text-foreground/90">{article.title}</h3>
                            <div className="text-[9px] text-muted-foreground font-bold uppercase">{format(new Date(article.publishedAt), 'MMM d, yyyy')}</div>
                        </Link>
                    </div>
                 ))}
             </div>
          </section>
      </div>

      {/* Divider */}
      <div className="py-4 border-y border-border mb-12"></div>

      {/* Breaking Section */}
      <section className="mb-12">
          <div className="bg-primary text-primary-foreground inline-block px-4 py-1.5 font-bold italic uppercase tracking-wider text-sm mb-6">
              Breaking
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {breakingNews.map((article, idx) => (
                 <Link to={`/article/${article.id}`} key={article.id} className="group relative w-full aspect-[4/5] bg-zinc-900 border border-border overflow-hidden flex flex-col">
                     {article.imageUrl ? (
                         <div className="absolute inset-0">
                             <img src={article.imageUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-4">
                                 <span className="bg-primary text-primary-foreground text-[10px] uppercase font-bold px-1.5 py-0.5 w-fit mb-3">{article.category}</span>
                                 <h3 className="text-white font-serif font-bold text-lg leading-tight drop-shadow-md">
                                     {article.title}
                                 </h3>
                             </div>
                         </div>
                     ) : (
                         <div className="absolute flex flex-col justify-center items-center text-center p-6 inset-0 bg-zinc-900 text-white">
                            <span className="text-primary text-[10px] uppercase font-bold tracking-widest mb-4 border-b border-primary/50 pb-2">{article.category}</span>
                            <h3 className="text-white font-serif font-bold text-xl leading-tight mb-4">
                                {article.title}
                            </h3>
                            <p className="text-zinc-400 text-xs italic font-serif opacity-80">{format(new Date(article.publishedAt), 'MMM d, yyyy')}</p>
                         </div>
                     )}
                 </Link>
              ))}
          </div>
      </section>

      {/* Geopolitics Fold */}
      <section className="mb-16 border-t border-border pt-12">
          <div className="flex justify-between items-end border-b border-border pb-4 mb-8">
              <h2 className="text-4xl font-old-english font-bold capitalize text-foreground">Geopolitics</h2>
              <Link to="/category/geopolitics" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">See all →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {geopolitics.map(article => (
                  <Link to={`/article/${article.id}`} key={article.id} className="group flex flex-col">
                       {article.imageUrl && (
                           <div className="w-full aspect-[16/9] overflow-hidden bg-muted mb-4">
                               <img src={article.imageUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                           </div>
                       )}
                       <span className="text-[10px] text-primary uppercase tracking-widest font-bold mb-2">{article.region}</span>
                       <h3 className="font-serif font-bold text-lg leading-tight mb-3 group-hover:text-primary transition-colors">{article.title}</h3>
                       <p className="text-xs text-muted-foreground line-clamp-3 mb-4">{article.aiSummary}</p>
                       <span className="text-[10px] mt-auto font-bold text-muted-foreground uppercase">{formatDistanceToNow(new Date(article.publishedAt))} ago</span>
                  </Link>
              ))}
          </div>
      </section>

      {/* Tech & Security Fold */}
      <section className="mb-16 border-t-4 border-foreground pt-12">
          <div className="flex justify-between items-end border-b border-border pb-4 mb-8">
              <h2 className="text-4xl font-old-english font-bold capitalize text-foreground">Tech & Security</h2>
              <Link to="/category/tech" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">See all →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {techPolicy.map((article, idx) => (
                  <Link to={`/article/${article.id}`} key={article.id} className="group flex flex-col border border-border p-6 hover:bg-muted/30 transition-colors">
                       <span className="text-[10px] text-primary uppercase tracking-widest font-bold mb-3">{article.category}</span>
                       <h3 className="font-serif font-bold text-xl leading-snug mb-4 group-hover:text-primary transition-colors">{article.title}</h3>
                       <p className="text-sm text-foreground/80 font-serif leading-relaxed line-clamp-4 mb-6">{article.aiSummary}</p>
                       <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border">
                           <div className="text-[10px] font-bold text-muted-foreground uppercase">{article.sourceName}</div>
                           <div className="text-[10px] text-muted-foreground uppercase">&bull; {formatDistanceToNow(new Date(article.publishedAt))} ago</div>
                       </div>
                  </Link>
              ))}
          </div>
      </section>

      {/* Economy & Trade Fold */}
      <section className="mb-16 border-t border-border pt-12">
          <div className="flex justify-between items-end border-b border-border pb-4 mb-8">
              <h2 className="text-4xl font-old-english font-bold capitalize text-foreground">Economy & Trade</h2>
              <Link to="/category/economy" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">See all →</Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 flex flex-col">
                  {economy[0] && (
                     <Link to={`/article/${economy[0].id}`} className="group flex flex-col md:flex-row gap-6 pb-8 border-b border-border mb-8">
                         {economy[0].imageUrl && (
                             <div className="w-full md:w-1/2 aspect-[4/3] bg-muted overflow-hidden shrink-0">
                                 <img src={economy[0].imageUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                             </div>
                         )}
                         <div className="w-full md:w-1/2 flex flex-col justify-center">
                             <span className="text-[10px] text-primary uppercase tracking-widest font-bold mb-3">{economy[0].region}</span>
                             <h3 className="font-serif font-black text-3xl leading-tight mb-4 group-hover:text-primary transition-colors">{economy[0].title}</h3>
                             <p className="text-sm font-serif text-muted-foreground leading-relaxed mb-6">{economy[0].aiSummary}</p>
                             <span className="text-[10px] font-bold text-muted-foreground uppercase mt-auto">{formatDistanceToNow(new Date(economy[0].publishedAt))} ago</span>
                         </div>
                     </Link>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      {economy.slice(1, 5).map(article => (
                          <Link to={`/article/${article.id}`} key={article.id} className="group flex gap-4">
                               {article.imageUrl && (
                                   <div className="w-24 h-24 bg-muted overflow-hidden shrink-0">
                                       <img src={article.imageUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" />
                                   </div>
                               )}
                               <div className="flex flex-col justify-center">
                                   <h4 className="font-serif font-bold text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-3">{article.title}</h4>
                                   <span className="text-[9px] font-bold text-muted-foreground uppercase mt-auto">{format(new Date(article.publishedAt), 'MMM d')}</span>
                               </div>
                          </Link>
                      ))}
                  </div>
              </div>
              <div className="lg:col-span-4 bg-muted/30 p-6 border border-border">
                  <h3 className="text-2xl font-old-english font-bold capitalize border-b border-border pb-4 mb-6 text-primary">In-depth</h3>
                  <div className="flex flex-col gap-6">
                      {moreStories.slice(0, 4).map(article => (
                          <Link to={`/article/${article.id}`} key={article.id} className="group">
                              <h4 className="font-serif font-bold text-base leading-snug mb-2 group-hover:text-primary transition-colors">{article.title}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{article.aiSummary}</p>
                              <div className="bg-primary/10 text-primary text-[9px] uppercase tracking-widest px-2 py-1 inline-block font-bold">5 Min Read</div>
                          </Link>
                      ))}
                  </div>
              </div>
          </div>
      </section>

      {/* Global Markets Snapshot */}
      <section className="mb-16 border-t-8 border-foreground pt-12">
          <div className="flex justify-between items-end border-b border-border pb-4 mb-8">
              <h2 className="text-4xl font-old-english font-bold capitalize text-foreground">Global Markets</h2>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Finance &amp; Business</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
             <div className="md:col-span-2">
                 {globalMarkets[0] && (
                     <Link to={`/article/${globalMarkets[0].id}`} className="group block mb-12">
                        <span className="bg-foreground text-background text-[10px] uppercase tracking-widest font-bold px-2 py-1 mb-4 inline-block">Market Lead</span>
                        <h3 className="font-serif font-black text-4xl lg:text-5xl leading-tight mb-4 group-hover:text-primary transition-colors">{globalMarkets[0].title}</h3>
                        <p className="text-lg text-muted-foreground font-serif leading-relaxed line-clamp-4">{globalMarkets[0].aiSummary}</p>
                     </Link>
                 )}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-t border-border pt-8">
                     {globalMarkets.slice(1, 3).map(article => (
                         <Link to={`/article/${article.id}`} key={article.id} className="group">
                             <span className="text-[10px] text-primary uppercase tracking-widest font-bold mb-2 block">{article.category}</span>
                             <h4 className="font-serif font-bold text-xl leading-snug mb-3 group-hover:text-primary transition-colors">{article.title}</h4>
                             <p className="text-sm text-foreground/80 line-clamp-3">{article.aiSummary}</p>
                         </Link>
                     ))}
                 </div>
             </div>
             <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-border pt-8 md:pt-0 md:pl-12 flex flex-col gap-8">
                 {globalMarkets.slice(3).map(article => (
                     <Link to={`/article/${article.id}`} key={article.id} className="group border-b border-border pb-8 last:border-0 last:pb-0">
                         <span className="text-[8px] text-muted-foreground uppercase tracking-widest font-bold mb-2 block">{format(new Date(article.publishedAt), 'MMM d, yyyy')}</span>
                         <h4 className="font-serif font-bold text-lg leading-snug mb-2 group-hover:text-primary transition-colors">{article.title}</h4>
                     </Link>
                 ))}
             </div>
          </div>
      </section>

      {/* Environment & Science Fold */}
      <section className="mb-16 border-t-2 border-foreground pt-12">
          <div className="flex justify-center items-center border-b border-border pb-4 mb-8">
              <h2 className="text-4xl font-old-english font-italic font-bold capitalize text-foreground text-center">Climate &amp; Science</h2>
          </div>
          <div className="columns-1 md:columns-2 lg:columns-4 gap-8">
              {climateStories.map(article => (
                  <Link to={`/article/${article.id}`} key={article.id} className="group block w-full mb-8 break-inside-avoid">
                       <div className="flex flex-col border border-border p-5 bg-muted/10 hover:bg-muted/30 transition-colors">
                           <div className="flex justify-between items-center mb-4">
                               <span className="text-[10px] text-primary uppercase tracking-widest font-bold">In Focus</span>
                               <span className="text-[10px] text-muted-foreground uppercase opacity-80">{format(new Date(article.publishedAt), 'MMM d')}</span>
                           </div>
                           <h3 className="font-serif font-bold text-xl leading-snug mb-3 group-hover:text-primary transition-colors">{article.title}</h3>
                           <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{article.aiSummary}</p>
                       </div>
                  </Link>
              ))}
          </div>
      </section>

      {/* The Wire / More Stories Grid */}
      <section className="mb-12 pb-12 border-t border-border pt-12">
          <div className="flex justify-between items-end border-b-2 border-foreground pb-4 mb-8">
              <h2 className="text-4xl font-old-english font-bold capitalize text-foreground">The Wire</h2>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Latest Transmissions</span>
          </div>
          <div className="columns-1 sm:columns-2 lg:columns-4 gap-8">
              {moreStories.slice(4).map((article, idx) => (
                  <Link to={`/article/${article.id}`} key={article.id} className="group flex flex-col items-start pt-4 border-t border-border/50 mb-8 break-inside-avoid">
                     {idx % 3 === 0 && article.imageUrl && (
                         <div className="w-full h-32 mb-4 bg-muted overflow-hidden">
                             <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                         </div>
                     )}
                     <div className="w-full flex justify-between items-start mb-3">
                         <span className="text-[10px] text-primary uppercase tracking-widest font-bold">{article.category}</span>
                         <span className="text-[9px] text-muted-foreground uppercase font-bold">{formatDistanceToNow(new Date(article.publishedAt))}</span>
                     </div>
                     <h3 className="font-serif font-bold text-base leading-tight mb-2 group-hover:text-primary transition-colors">{article.title}</h3>
                     <p className="text-sm text-foreground/80 line-clamp-4 leading-relaxed">{article.excerpt || article.aiSummary}</p>
                  </Link>
              ))}
          </div>
      </section>

    </div>
  );
}
