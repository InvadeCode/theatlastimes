import { Outlet, Link } from "react-router-dom";
import { format } from "date-fns";
import { Search, User, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Article } from "../../types";

export default function Layout() {
  const categories = [
    "World",
    "India",
    "GCC",
    "Saudi Arabia",
    "Business",
    "Economy",
    "Finance",
    "Politics",
    "Technology",
    "AI",
    "Sports",
    "More",
  ];

  const [breakingNews, setBreakingNews] = useState<Article[]>([]);

  useEffect(() => {
    fetch("/api/news?limit=7")
      .then((res) => res.json())
      .then((data) => {
        setBreakingNews(data.data || []);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans w-full border-x border-border/40 shadow-sm shadow-black/5 px-[3vw]">
      <header className="bg-background pt-0 sticky top-0 z-50">
        {/* Red Live News Channel Banner */}
        <div className="bg-[#cc0000] text-white w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] py-1.5 flex items-center text-[10px] sm:text-xs tracking-widest font-bold uppercase overflow-hidden whitespace-nowrap px-0 border-b-2 border-black">
          <div className="bg-black text-white px-3 py-1 flex items-center gap-2 shrink-0 z-10 shadow-[4px_0_10px_rgba(204,0,0,1)]">
            <span className="w-2 h-2 rounded-full bg-[#cc0000] animate-pulse"></span>
            BREAKING NEWS
          </div>
          <div className="flex-1 overflow-hidden ml-4 pb-0.5">
            <div className="animate-marquee whitespace-nowrap flex gap-12 text-white/90">
              {breakingNews.slice(0, 5).map((article) => (
                <span
                  key={article.id}
                  className="cursor-pointer hover:text-white transition-colors"
                >
                  {article.title}
                </span>
              ))}
              {breakingNews.slice(0, 5).map((article) => (
                <span
                  key={`${article.id}-dup`}
                  className="cursor-pointer hover:text-white transition-colors"
                >
                  {article.title}
                </span>
              ))}
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
            <div className="flex animate-marquee whitespace-nowrap gap-8 items-center cursor-default">
              <span>
                S&P 500{" "}
                <span className="text-green-600 font-bold">▲ 5,234.18</span>
              </span>
              <span>
                DOW <span className="text-red-600 font-bold">▼ 38,714.77</span>
              </span>
              <span>
                NASDAQ{" "}
                <span className="text-green-600 font-bold">▲ 16,346.21</span>
              </span>
              <span>
                FTSE 100{" "}
                <span className="text-red-600 font-bold">▼ 7,900.02</span>
              </span>
              <span>
                NIKKEI{" "}
                <span className="text-green-600 font-bold">▲ 40,111.45</span>
              </span>
              <span>
                GOLD{" "}
                <span className="text-green-600 font-bold">▲ $2,156.20</span>
              </span>
              {/* Duplicated for smooth loop */}
              <span>
                S&P 500{" "}
                <span className="text-green-600 font-bold">▲ 5,234.18</span>
              </span>
              <span>
                DOW <span className="text-red-600 font-bold">▼ 38,714.77</span>
              </span>
              <span>
                NASDAQ{" "}
                <span className="text-green-600 font-bold">▲ 16,346.21</span>
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            <span className="hidden lg:inline text-foreground">
              VOL. CXXII... No. 60,114
            </span>
            <span className="hidden md:inline">New York: 22°C</span>
          </div>
        </div>

        {/* Top utility bar & Masthead */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center py-4 border-b-2 border-foreground text-xs uppercase tracking-widest font-bold">
          <div className="flex items-center gap-6 text-foreground/80">
            <button className="flex items-center gap-2 hover:text-primary transition-colors">
              <span className="hidden md:inline">Menu</span>
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer text-muted-foreground font-normal">
              <span className="capitalize">Search</span>
              <Search className="w-4 h-4" />
            </div>
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
                My account
              </span>
            </Link>
            <button className="bg-primary text-primary-foreground px-4 py-2 font-bold uppercase hover:bg-primary/90 transition-colors">
              Subscribe
            </button>
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

      <main className="flex-1 w-full bg-background pt-4 pb-20">
        <Outlet />
      </main>

      <footer className="py-16 px-8 bg-zinc-950 text-zinc-400 border-t-4 border-foreground mt-0">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 text-sm">
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
