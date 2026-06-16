import { Outlet, Link, useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { Search, User, Menu, X } from "lucide-react";
import { useEffect, useState, Fragment } from "react";
import { Article } from "../../types";
import { useAuth } from "../../lib/useAuth";

export default function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const categories = [
    "Business",
    "Economy",
    "Finance",
    "Politics",
    "Technology",
    "AI"
  ];

  const [breakingNews, setBreakingNews] = useState<Article[]>([]);

  useEffect(() => {
    fetch("/api/news?limit=15")
      .then((res) => res.json())
      .then((data) => {
        let bNews = data.data || [];
        bNews = bNews.filter((a: Article) => a.importanceScore >= 80).sort((a: Article, b: Article) => b.importanceScore - a.importanceScore).slice(0, 8);
        if (bNews.length === 0) bNews = (data.data || []).slice(0, 8);
        setBreakingNews(bNews);
      })
      .catch((err) => console.error(err));
  }, []);

  const foundingDate = new Date('1924-01-01');
  const today = new Date();
  const volumeNumber = today.getFullYear() - foundingDate.getFullYear();
  const editionNumber = 50000 + differenceInDays(today, foundingDate);
  
  const romanize = (num: number) => {
    const lookup: any = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let roman = '', i;
    for ( i in lookup ) {
      while ( num >= lookup[i] ) {
        roman += i;
        num -= lookup[i];
      }
    }
    return roman;
  };
  
  const volumeRoman = romanize(volumeNumber);

  return (
    <div className="min-h-screen print:min-h-0 bg-background flex flex-col print:block font-sans w-full mx-auto shadow-sm shadow-black/5 px-2 sm:px-4 lg:px-8 print:px-0 print:border-none print:shadow-none print:max-w-none">
      <header className="bg-background pt-0 sticky top-0 z-50 print:hidden">
        {/* Red Live News Channel Banner */}
        <div className="bg-[#cc0000] text-white py-1.5 flex items-center text-[10px] sm:text-xs tracking-widest font-bold uppercase overflow-hidden whitespace-nowrap border-b-2 border-black -mx-4 sm:-mx-8 lg:-mx-12">
          <div className="bg-black text-white px-3 py-1 flex items-center gap-2 shrink-0 z-10 shadow-[4px_0_10px_rgba(204,0,0,1)] ml-4 sm:ml-8 lg:ml-12">
            <span className="w-2 h-2 rounded-full bg-[#cc0000] animate-pulse"></span>
            BREAKING NEWS
          </div>
          <div className="flex-1 overflow-hidden ml-4 pb-0.5 relative">
            <div className="w-max flex animate-marquee items-center text-white/90">
              {breakingNews.length > 0 ? (
                <>
                  <div className="flex gap-12 pr-12 text-white/90">
                    {[...Array(5)].map((_, i) => (
                      <Fragment key={i}>
                        {breakingNews.map((article) => (
                          <Link
                            to={`/article/${article.id}`}
                            key={`${article.id}-${i}`}
                            className="cursor-pointer hover:text-white transition-colors"
                          >
                            {article.title}
                          </Link>
                        ))}
                      </Fragment>
                    ))}
                  </div>
                  <div className="flex gap-12 pr-12 text-white/90">
                    {[...Array(5)].map((_, i) => (
                      <Fragment key={i}>
                        {breakingNews.map((article) => (
                          <Link
                            to={`/article/${article.id}`}
                            key={`${article.id}-${i}-dup`}
                            className="cursor-pointer hover:text-white transition-colors"
                          >
                            {article.title}
                          </Link>
                        ))}
                      </Fragment>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex gap-12 pr-12 text-white/90">
                  <span className="animate-pulse">Loading intelligence streams...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Newspaper Info & Stock Ticker */}
        <div className="flex justify-between items-center text-[10px] sm:text-xs uppercase tracking-widest font-bold border-b border-border pb-2 pt-2 mb-2 gap-4">
          <div className="flex gap-4">
            <span className="hidden sm:inline">Global Edition</span>
            <span>{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
            <span className="hidden md:inline">Today's Paper</span>
          </div>

          <div className="flex overflow-hidden flex-1 max-w-[60%] lg:max-w-[40%] text-muted-foreground border-l border-r border-border px-4 relative">
            <div className="flex w-max animate-[marquee_120s_linear_infinite] items-center cursor-default">
              <div className="flex flex-row whitespace-nowrap gap-8 pr-8 items-center shrink-0">
                {[...Array(4)].map((_, i) => (
                  <Fragment key={i}>
                    <span className="whitespace-nowrap">S&P 500 <span className="text-green-600 font-bold ml-1">▲ 5,234.18</span></span>
                    <span className="whitespace-nowrap">DOW <span className="text-red-600 font-bold ml-1">▼ 38,714.77</span></span>
                    <span className="whitespace-nowrap">NASDAQ <span className="text-green-600 font-bold ml-1">▲ 16,346.21</span></span>
                    <span className="whitespace-nowrap">FTSE 100 <span className="text-red-600 font-bold ml-1">▼ 7,900.02</span></span>
                    <span className="whitespace-nowrap">NIKKEI <span className="text-green-600 font-bold ml-1">▲ 40,111.45</span></span>
                    <span className="whitespace-nowrap">GOLD <span className="text-green-600 font-bold ml-1">▲ $2,156.20</span></span>
                  </Fragment>
                ))}
              </div>
              <div className="flex flex-row whitespace-nowrap gap-8 pr-8 items-center shrink-0">
                {[...Array(4)].map((_, i) => (
                  <Fragment key={i}>
                    <span className="whitespace-nowrap">S&P 500 <span className="text-green-600 font-bold ml-1">▲ 5,234.18</span></span>
                    <span className="whitespace-nowrap">DOW <span className="text-red-600 font-bold ml-1">▼ 38,714.77</span></span>
                    <span className="whitespace-nowrap">NASDAQ <span className="text-green-600 font-bold ml-1">▲ 16,346.21</span></span>
                    <span className="whitespace-nowrap">FTSE 100 <span className="text-red-600 font-bold ml-1">▼ 7,900.02</span></span>
                    <span className="whitespace-nowrap">NIKKEI <span className="text-green-600 font-bold ml-1">▲ 40,111.45</span></span>
                    <span className="whitespace-nowrap">GOLD <span className="text-green-600 font-bold ml-1">▲ $2,156.20</span></span>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="hidden lg:inline text-foreground">
              VOL. {volumeRoman}... No. {editionNumber.toLocaleString()}
            </span>
            <span className="hidden md:inline">Global Edition</span>
          </div>
        </div>

        {/* Top utility bar & Masthead */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center py-4 border-b-2 border-foreground text-xs uppercase tracking-widest font-bold">
          <div className="flex items-center gap-6 text-foreground/80">
            <button
               onClick={() => setMenuOpen(true)}
               className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
            >
              <span className="hidden md:inline">Menu</span>
              <Menu className="w-5 h-5" />
            </button>
            <Link to="/archives" className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer text-muted-foreground font-normal">
              <span className="capitalize">Search</span>
              <Search className="w-4 h-4" />
            </Link>
            <Link to="/briefcase" className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer text-muted-foreground font-normal">
              <span className="capitalize">Briefcase</span>
            </Link>
          </div>

          <div className="flex justify-center items-center overflow-hidden px-4 md:px-8 tracking-normal">
            <Link
              to="/"
              className="text-4xl md:text-6xl lg:text-[5rem] leading-none font-old-english font-bold normal-case tracking-normal text-foreground whitespace-nowrap pt-4 pb-2"
            >
              The Atlas Times
            </Link>
          </div>

          <div className="flex items-center justify-end gap-6 text-foreground/80">
            <Link
              to="/preferences"
              className="hidden md:flex flex-col md:flex-row items-center gap-2 hover:text-primary transition-colors"
            >
              <User className="w-5 h-5" />
              <span className="capitalize font-normal text-muted-foreground">
                Preferences
              </span>
            </Link>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <nav className="flex justify-center gap-4 md:gap-8 py-4 border-b-4 border-double border-foreground w-full overflow-x-auto text-xs font-bold capitalize tracking-wide bg-background">
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/category/${cat.toLowerCase()}`}
              className="hover:text-primary transition-colors text-foreground whitespace-nowrap"
            >
              {cat}
            </Link>
          ))}
        </nav>
      </header>

      {/* Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex">
          <div className="w-80 h-full bg-background border-r-2 border-foreground shadow-2xl flex flex-col p-8 overflow-y-auto animate-fade-in">
            <div className="flex justify-between items-center mb-12">
               <h2 className="font-old-english text-3xl font-bold">Sections</h2>
               <button onClick={() => setMenuOpen(false)} className="hover:text-primary transition-colors">
                 <X className="w-8 h-8" />
               </button>
            </div>
            
            <div className="flex flex-col gap-6 font-serif text-2xl">
               {categories.map((cat) => (
                 <Link
                   key={cat}
                   to={`/category/${cat.toLowerCase()}`}
                   onClick={() => setMenuOpen(false)}
                   className="hover:text-primary transition-colors border-b border-border pb-2"
                 >
                   {cat}
                 </Link>
               ))}
            </div>
            <div className="mt-12 flex flex-col gap-4 uppercase tracking-widest text-sm font-bold text-muted-foreground">
               <Link to="/new-news" onClick={() => setMenuOpen(false)} className="hover:text-foreground">Editorial Desk</Link>
               <Link to="/archives" onClick={() => setMenuOpen(false)} className="hover:text-foreground">Archives</Link>
               <Link to="/briefcase" onClick={() => setMenuOpen(false)} className="hover:text-foreground">Briefcase</Link>
               <Link to="/preferences" onClick={() => setMenuOpen(false)} className="hover:text-foreground">My Account</Link>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMenuOpen(false)}></div>
        </div>
      )}

      <main className="flex-1 print:flex-none w-full bg-background pt-4 pb-20 print:pb-0 print:pt-0">
        <Outlet />
      </main>

      <footer className="py-16 px-8 bg-zinc-950 text-zinc-400 border-t-4 border-foreground mt-0 print:hidden">
        <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-12 text-sm">
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-2xl text-zinc-100 font-bold mb-2">The Atlas Times</h3>
            <p className="leading-relaxed">
              Global intelligence, geopolitical analysis, and strategic news aggregation. 
              Delivering executive-grade insights on economy, policy, and global affairs.
            </p>
            <div className="text-xs uppercase tracking-widest font-bold mt-4">
              © {new Date().getFullYear()} Atlas Intelligence
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <h4 className="font-bold uppercase tracking-widest text-zinc-100 mb-2">Sections</h4>
            <Link to="/category/world" className="hover:text-white transition-colors">World</Link>
            <Link to="/category/economy" className="hover:text-white transition-colors">Economy</Link>
            <Link to="/category/technology" className="hover:text-white transition-colors">Technology</Link>
            <Link to="/category/politics" className="hover:text-white transition-colors">Politics</Link>
            <Link to="/category/business" className="hover:text-white transition-colors">Business</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="font-bold uppercase tracking-widest text-zinc-100 mb-2">Company</h4>
            <span className="hover:text-white transition-colors cursor-pointer">About Us</span>
            <span className="hover:text-white transition-colors cursor-pointer">Careers</span>
            <span className="hover:text-white transition-colors cursor-pointer">Data Ethics</span>
            <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
            <Link to="/new-news" className="hover:text-white transition-colors">Editorial Desk</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="font-bold uppercase tracking-widest text-zinc-100 mb-2">Resources</h4>
            <span className="hover:text-white transition-colors cursor-pointer">Daily Briefings</span>
            <span className="hover:text-white transition-colors cursor-pointer">Newsletters</span>
            <span className="hover:text-white transition-colors cursor-pointer">Podcasts</span>
            <Link to="/archives" className="hover:text-white transition-colors font-bold text-zinc-200">Archives</Link>
            <span className="hover:text-white transition-colors cursor-pointer">Contact Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
