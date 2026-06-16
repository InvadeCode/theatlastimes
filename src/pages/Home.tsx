import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { Article, AI_Briefing } from "../types";

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [popular, setPopular] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [freshIndex, setFreshIndex] = useState(0);

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

  const exclusives = articles.filter((a: Article) => {
    const tagsLower = a.tags ? a.tags.map(t => t.toLowerCase()) : [];
    return a.id.startsWith("src-editorial") || a.id.startsWith("editorial") || tagsLower.includes("exclusive") || tagsLower.includes("breaking");
  });
  
  const getFallback = (a: Article) => {
     if (a.imageUrl) return a.imageUrl;
     const h = a.title ? a.title.charCodeAt(0) : 1;
     return `https://picsum.photos/seed/${h}/800/450`;
  };

  const nonExclusives = articles.filter((a: Article) => !exclusives.find((e: Article) => e.id === a.id));

  // Top row gets all exclusives, padded with non-exclusives to reach 5
  const topStrip = [...exclusives, ...nonExclusives].filter((a, i, arr) => arr.findIndex(t => t.id === a.id) === i).slice(0, 5);
  
  // The rest of the content pulls from non-exclusives to avoid duplicating what's in the top strip explicitly
  const heroArticle = nonExclusives.find(a => !topStrip.includes(a)) || nonExclusives[0];
  const freshStoriesPool = nonExclusives.filter(a => a.id !== heroArticle?.id && !topStrip.includes(a));
  const freshStories = freshStoriesPool.slice(freshIndex, 5 + freshIndex);
  const popularStories = popular.slice(0, 5);
  
  const handlePrevFresh = () => setFreshIndex(prev => Math.max(0, prev - 5));
  const handleNextFresh = () => setFreshIndex(prev => {
     const next = prev + 5;
     return next >= freshStoriesPool.length ? prev : next;
  });
  
  const breakingNews = articles.filter(a => a.importanceScore > 85).slice(0, 5);

  const filterAndPad = (predicate: (a: Article) => boolean, count: number) => {
      const filtered = articles.filter(predicate);
      return filtered.slice(0, count);
  };

  const geopolitics = filterAndPad(a => a.category === "Geopolitics" || a.category === "Global", 5);
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
        <Helmet>
            <title>The Atlas Times | Real-Time Global Updates</title>
            <meta name="description" content="Discover intelligence briefings and global news curated for clarity. Fast, AIO-optimized insights covering Geopolitics, Technology, and Markets." />
        </Helmet>
        
      {/* Top Story Strip */}
      <div className="flex overflow-x-auto lg:grid lg:grid-cols-5 gap-4 py-4 border-b-2 border-border mb-8 snap-x snap-mandatory">
         {topStrip.map(article => (
            <Link to={`/article/${article.id}`} key={article.id} className="group min-w-[280px] sm:min-w-[320px] lg:min-w-0 flex flex-col gap-2 relative pl-4 border-l border-border hover:opacity-80 transition-opacity snap-start">
                {(article.importanceScore > 85 || (article.tags && article.tags.map(t=>t.toLowerCase()).includes("exclusive")) || article.id.startsWith("editorial") || article.id.startsWith("src-editorial")) && (
                   <span className="text-primary text-[9px] uppercase font-bold tracking-widest">Exclusive</span>
                )}
                <h4 className="font-serif font-bold text-sm lg:text-base leading-snug text-foreground group-hover:text-primary transition-colors">{article.title}</h4>
                <div className="text-[9px] w-full flex-wrap uppercase tracking-widest text-muted-foreground flex gap-2">
                   <span className="text-primary font-bold">{article.category}</span>
                   <span>{format(new Date(article.publishedAt), 'MMM d, yyyy')}</span>
                </div>
            </Link>
         ))}
      </div>

      {/* Main Editorial Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 2xl:grid-cols-12 gap-8 mb-12">
          
          {/* Left Column: Fresh Stories */}
          <section className="col-span-1 lg:col-span-3 2xl:col-span-2 flex flex-col pt-2 lg:pr-4">
              <h2 className="text-4xl font-old-english font-bold mb-1">Fresh stories</h2>
              <p className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-6 leading-relaxed">Today: Browse our editor's hand-picked articles!</p>
              
              <div className="flex flex-col gap-5">
                 {freshStories.map((article, idx) => (
                    <div key={article.id} className="border-b border-border pb-5 last:border-0">
                        {idx === 0 && (
                            <Link to={`/article/${article.id}`} className="block mb-3 aspect-video overflow-hidden border border-border group">
                                <img src={getFallback(article)} alt="" className="w-full h-full object-cover grayscale opacity-90 mix-blend-multiply group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" />
                            </Link>
                        )}
                        {article.tags?.includes("Exclusive") && (
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
                    <button onClick={handlePrevFresh} disabled={freshIndex === 0} className={`hover:text-primary transition-colors ${freshIndex === 0 ? "opacity-50 cursor-not-allowed" : ""}`}>&larr;</button>
                    <button onClick={handleNextFresh} disabled={freshIndex + 5 >= freshStoriesPool.length} className={`hover:text-primary transition-colors ${freshIndex + 5 >= freshStoriesPool.length ? "opacity-50 cursor-not-allowed" : ""}`}>&rarr;</button>
                 </div>
              </div>
          </section>

          {/* Center Column: Featured Hero & Secondary */}
          <section className="col-span-1 lg:col-span-6 2xl:col-span-7 flex flex-col lg:px-4 lg:border-x lg:border-border">
              {heroArticle && (
                  <Link to={`/article/${heroArticle.id}`} className="group relative w-full mb-8 overflow-hidden bg-background">
                      <div className="w-full aspect-[16/9] mb-1 overflow-hidden border border-border">
                          <img src={getFallback(heroArticle)} alt={heroArticle.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 hover:scale-105" />
                      </div>
                      {(heroArticle.imageSource || heroArticle.imageCredit) && (
                          <div className="text-[9px] uppercase tracking-widest text-muted-foreground w-full text-right mb-4">
                              Photo: {heroArticle.imageCredit} {heroArticle.imageSource && `(${heroArticle.imageSource})`}
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
          
          <section className="col-span-1 lg:col-span-3 2xl:col-span-3 flex flex-col lg:pl-4">
             <div className="bg-background relative">
                 <h2 className="text-4xl font-old-english font-bold mb-6">Popular</h2>
                 
                 {popularStories.map((article, idx) => (
                    <div key={article.id} className="mb-6 last:mb-0 border-b border-border pb-6 last:border-0 group">
                        <Link to={`/article/${article.id}`}>
                            {article.tags?.includes("Exclusive") && (
                                <span className="bg-primary text-primary-foreground text-[8px] uppercase font-bold px-1.5 py-0.5 mb-2 inline-block shadow-sm">Exclusive</span>
                            )}
                            <div className="text-[9px] uppercase tracking-widest text-primary font-bold mb-1">{article.category}</div>
                            <h3 className="font-serif font-bold text-base leading-snug group-hover:text-primary transition-colors mb-2 text-foreground/90">{article.title}</h3>
                            {(idx === 1 || idx === 2) && (
                                <div className="mt-3 mb-2 w-full aspect-[4/3] overflow-hidden border border-border">
                                    <img src={getFallback(article)} alt="" className="w-full h-full object-cover grayscale opacity-90 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105 mix-blend-multiply" />
                                </div>
                            )}
                            <div className="text-[9px] text-muted-foreground font-bold uppercase">{format(new Date(article.publishedAt), 'MMM d, yyyy')}</div>
                        </Link>
                    </div>
                 ))}
             </div>
          </section>
      </div>

      {/* Divider */}
      <div className="py-2 border-y-4 border-double border-border mb-12 flex justify-center items-center">
          <span className="font-old-english text-xl text-muted-foreground opacity-50 tracking-widest hidden sm:inline-block">The Atlas Times</span>
      </div>

      {/* Breaking Section */}
      <section className="mb-12">
          <div className="bg-[#cc0000] text-white inline-flex px-6 py-2 tracking-widest text-xs mb-8 uppercase font-bold items-center shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse mr-3 block"></span> Breaking Analysis
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
              {breakingNews.map((article, idx) => {
                 const bgImage = getFallback(article);
                 return (
                 <Link to={`/article/${article.id}`} key={article.id} className="group relative w-full aspect-[4/5] bg-zinc-900 border border-border overflow-hidden flex flex-col">
                         <img src={bgImage} className="absolute inset-0 w-full h-full object-cover grayscale opacity-40 group-hover:opacity-60 transition-opacity" alt="" />
                         <div className="absolute flex flex-col justify-center items-center text-center p-6 inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/80 to-transparent text-white">
                            <span className="text-primary text-[10px] uppercase font-bold tracking-widest mb-4 border-b border-primary/50 pb-2">{article.category}</span>
                            <h3 className="text-white font-serif font-bold text-xl leading-tight mb-4 group-hover:text-primary transition-colors">
                                {article.title}
                            </h3>
                            <p className="text-zinc-400 text-xs italic font-serif opacity-80 mb-2">{format(new Date(article.publishedAt), 'MMM d, yyyy')}</p>
                            {(article.imageSource || article.imageCredit) && (
                                <p className="text-[8px] uppercase tracking-wider text-zinc-500 opacity-60 mt-auto">Image: {article.imageSource || article.imageCredit}</p>
                            )}
                         </div>
                 </Link>
              )})}
          </div>
      </section>

      {/* Geopolitics Fold */}
      <section className="mb-16 pt-12 border-t-8 border-double border-border">
          <div className="flex justify-between items-end border-b-2 border-foreground pb-4 mb-8">
              <h2 className="text-4xl lg:text-5xl font-old-english font-bold capitalize text-foreground">Geopolitics</h2>
              <Link to="/category/geopolitics" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">See all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8">
              {geopolitics.slice(0, 5).map(article => (
                  <Link to={`/article/${article.id}`} key={article.id} className="group flex flex-col">
                       <span className="text-[10px] text-primary uppercase tracking-widest font-bold mb-2">{article.region}</span>
                       <h3 className="font-serif font-bold text-lg leading-tight mb-3 group-hover:text-primary transition-colors">{article.title}</h3>
                       <div className="w-full aspect-video overflow-hidden border border-border mb-4">
                           <img src={getFallback(article)} alt="" className="w-full h-full object-cover grayscale group-hover:scale-105 transition-transform duration-500" />
                       </div>
                       <p className="text-sm font-serif text-muted-foreground line-clamp-3 mb-4">{article.aiSummary}</p>
                       <span className="text-[10px] mt-auto font-bold text-muted-foreground uppercase">{formatDistanceToNow(new Date(article.publishedAt))} ago</span>
                  </Link>
              ))}
          </div>
      </section>

      {/* Tech & Security Fold */}
      <section className="mb-16 pt-12 border-t border-border">
          <div className="flex justify-between items-end border-b-2 border-border pb-4 mb-8">
              <h2 className="text-4xl lg:text-5xl font-old-english font-bold capitalize text-foreground">Tech & Security</h2>
              <Link to="/category/tech" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">See all →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {techPolicy.slice(0, 3).map((article, idx) => (
                  <Link to={`/article/${article.id}`} key={article.id} className="group flex flex-col border border-border p-6 hover:bg-muted/30 transition-colors">
                       <span className="text-[10px] text-primary uppercase tracking-widest font-bold mb-3">{article.category}</span>
                       <h3 className="font-serif font-bold text-xl leading-snug mb-4 group-hover:text-primary transition-colors">{article.title}</h3>
                       <div className="w-full aspect-[4/3] mb-4 overflow-hidden border border-border">
                           <img src={getFallback(article)} alt="" className="w-full h-full object-cover grayscale mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />
                       </div>
                       <p className="text-sm text-foreground/80 font-serif leading-relaxed line-clamp-3 mb-6">{article.aiSummary}</p>
                       <div className="text-[10px] font-bold text-muted-foreground uppercase mt-auto border-t border-border pt-4">&bull; {formatDistanceToNow(new Date(article.publishedAt))} ago</div>
                  </Link>
              ))}
          </div>
      </section>

      {/* Economy & Trade Fold */}
      <section className="mb-16 pt-12 border-t-4 border-double border-foreground/50">
          <div className="flex justify-between items-end border-b border-border pb-4 mb-8">
              <h2 className="text-4xl lg:text-5xl font-old-english font-bold capitalize text-foreground">Economy & Trade</h2>
              <Link to="/category/economy" className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">See all →</Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 2xl:grid-cols-12 gap-8">
              <div className="lg:col-span-8 flex flex-col">
                  {economy[0] && (
                     <Link to={`/article/${economy[0].id}`} className="group flex flex-col md:flex-row gap-6 pb-8 border-b border-border mb-8">
                         <div className="w-full md:w-1/2 md:max-w-md shrink-0 aspect-[4/3] overflow-hidden border border-border">
                             <img src={getFallback(economy[0])} alt={economy[0].title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 hover:scale-105" />
                         </div>
                         <div className="w-full flex flex-col justify-center">
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
      <section className="mb-16 pt-12 border-t-[6px] border-double border-foreground">
          <div className="flex justify-between items-end border-b-2 border-border pb-4 mb-8">
              <h2 className="text-4xl lg:text-5xl font-old-english font-bold capitalize text-foreground">Global Markets</h2>
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Finance &amp; Business</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
             <div className="md:col-span-2">
                 {globalMarkets[0] && (
                     <Link to={`/article/${globalMarkets[0].id}`} className="group block mb-12">
                        <div className="w-full aspect-[21/9] mb-6 overflow-hidden border border-border">
                            <img src={getFallback(globalMarkets[0])} alt={globalMarkets[0].title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 hover:scale-105" />
                        </div>
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
      <section className="mb-16 pt-12 border-t border-border">
          <div className="flex justify-center items-center border-b-[3px] border-double border-foreground py-4 mb-8 bg-muted/10">
              <h2 className="text-4xl lg:text-5xl font-old-english font-black capitalize text-foreground text-center">Climate &amp; Science</h2>
          </div>
          <div className="columns-1 sm:columns-2 lg:columns-4 gap-8">
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
      <section className="mb-12 pb-12 pt-12 border-t border-border px-0 md:px-[2vw]">
          <div className="flex justify-between items-end border-b-4 border-double border-foreground pb-4 mb-8">
              <h2 className="text-4xl lg:text-5xl font-old-english font-black capitalize text-foreground">The Wire</h2>
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground bg-primary/10 text-primary px-3 py-1">Latest Transmissions</span>
          </div>
          <div className="columns-1 md:columns-2 lg:columns-4 2xl:columns-6 gap-6 md:gap-8">
              {moreStories.slice(0, 24).map((article, idx) => {
                  let titleClass = "text-base";
                  let summaryLines = "line-clamp-4";
                  
                  if (idx % 8 === 0) {
                      titleClass = "text-2xl lg:text-3xl font-black";
                      summaryLines = "line-clamp-6";
                  } else if (idx % 8 === 3) {
                      titleClass = "text-xl font-bold";
                      summaryLines = "line-clamp-3";
                  } else if (idx % 8 === 4) {
                      titleClass = "text-2xl font-black";
                      summaryLines = "line-clamp-6";
                  }

                  return (
                      <Link to={`/article/${article.id}`} key={article.id} className="group flex flex-col items-start pt-4 border-t border-border/50 mb-8 break-inside-avoid">
                         <div className="w-full flex justify-between items-start mb-3">
                             <span className="text-[10px] text-primary uppercase tracking-widest font-bold">{article.category}</span>
                             <span className="text-[9px] text-muted-foreground uppercase font-bold">{formatDistanceToNow(new Date(article.publishedAt))}</span>
                         </div>
                         <h3 className={`font-serif leading-tight mb-2 group-hover:text-primary transition-colors ${titleClass}`}>
                             {article.title}
                         </h3>
                         <p className={`text-sm text-foreground/80 leading-relaxed ${summaryLines}`}>{article.aiSummary}</p>
                      </Link>
                  )
              })}
          </div>
      </section>

    </div>
  );
}
