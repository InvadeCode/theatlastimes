import { Article, AI_Briefing } from "../types";

export const mockArticles: Article[] = [
  {
    id: "g1",
    title: "Global Summit Stalls as Key Nations Dispute Trade Tariffs",
    slug: "global-summit-stalls-trade-tariffs",
    sourceName: "World Desk",
    sourceUrl: "https://worlddesk.placeholder",
    originalUrl: "https://worlddesk.placeholder/news",
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    fetchedAt: new Date().toISOString(),
    category: "Geopolitics",
    region: "Global",
    language: "en",
    aiSummary: "The highly anticipated Global Economic Summit in Geneva has hit a roadblock as major delegations clash over new cross-border tariffs. Early talks broke down regarding subsidies on renewable energy tech, threatening the broader trade consensus.",
    keyPoints: [
      "Talks stalled over renewable energy subsidies.",
      "Developing nations demand exemptions from planned 15% tariff.",
      "Summit extended by one day to reach a compromise."
    ],
    whyItMatters: "Failure to reach an agreement could trigger a series of tit-for-tat trade measures, destabilizing global supply chains in the green energy sector.",
    tags: ["Trade", "Renewable Energy", "Geneva Summit"],
    importanceScore: 92,
    relevanceScore: 95,
    credibilityScore: 98,
    sentiment: "negative"
  },
  {
    id: "g2",
    title: "New AI Regulation Framework Proposed Across EU",
    slug: "eu-ai-regulation-framework",
    sourceName: "Atlas Brief",
    sourceUrl: "https://atlasbrief.placeholder",
    originalUrl: "https://atlasbrief.placeholder/ai",
    publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    fetchedAt: new Date().toISOString(),
    category: "Technology",
    subCategory: "AI",
    region: "Europe",
    language: "en",
    aiSummary: "European lawmakers introduced a sweeping new regulatory framework targeting generative AI models, requiring enhanced transparency in training data. Tech executives warn it could stifle innovation.",
    keyPoints: [
      "Requires explicit disclosure of copyrighted material in training data.",
      "Proposes independent audits for high-risk AI models.",
      "Fines up to 5% of global revenue for non-compliance."
    ],
    whyItMatters: "As the first comprehensive geopolitical response to generative AI, this framework sets a precedent that other jurisdictions are likely to follow, fundamentally altering the AI landscape.",
    tags: ["AI Regulation", "EU", "Technology Policy"],
    importanceScore: 88,
    relevanceScore: 90,
    credibilityScore: 95,
    sentiment: "mixed"
  },
  {
    id: "g3",
    title: "Central Banks Signal Rate Cuts Amid Stabilizing Inflation",
    slug: "central-banks-rate-cuts-inflation",
    sourceName: "Global Ledger",
    sourceUrl: "https://globalledger.placeholder",
    originalUrl: "https://globalledger.placeholder/finance",
    publishedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    fetchedAt: new Date().toISOString(),
    category: "Finance",
    subCategory: "Economy",
    region: "Global",
    language: "en",
    aiSummary: "Key central banks have shifted their tone, hinting at potential interest rate cuts in the next quarter. Recent data indicates that inflation is cooling faster than expected in major economies.",
    keyPoints: [
      "US Federal Reserve signals two potential cuts this year.",
      "European Central Bank already reduced rates by 25 basis points.",
      "Emerging markets respond positively with currency stabilization."
    ],
    whyItMatters: "Lower interest rates could spur investment and ease corporate debt burdens, injecting momentum into a slowing global economy.",
    tags: ["Interest Rates", "Inflation", "Monetary Policy"],
    importanceScore: 90,
    relevanceScore: 85,
    credibilityScore: 99,
    sentiment: "positive"
  },
  {
    id: "g4",
    title: "Defense Pacts Strengthened in Indo-Pacific Region",
    slug: "defense-pacts-indo-pacific",
    sourceName: "SignalWire News",
    sourceUrl: "https://signalwire.placeholder",
    originalUrl: "https://signalwire.placeholder/defense",
    publishedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    fetchedAt: new Date().toISOString(),
    category: "Geopolitics",
    subCategory: "Defense",
    region: "Asia-Pacific",
    language: "en",
    aiSummary: "A new trilateral defense agreement has been signed by regional powers in the Indo-Pacific, focusing on maritime security and joint naval exercises to ensure freedom of navigation in contested waters.",
    keyPoints: [
      "Agreement includes intelligence sharing and joint patrols.",
      "Focus on securing critical maritime trade routes.",
      "Seen as a stabilizing move by international observers."
    ],
    whyItMatters: "Enhances strategic deterrence in a critical economic zone, affecting global shipping lanes and regional stability.",
    tags: ["Defense", "Maritime Security", "Indo-Pacific"],
    importanceScore: 85,
    relevanceScore: 80,
    credibilityScore: 92,
    sentiment: "neutral"
  },
  {
    id: "g5",
    title: "Energy Transition: Record Investments in Grid Infrastructure",
    slug: "energy-transition-grid-investments",
    sourceName: "Verity Dispatch",
    sourceUrl: "https://veritydispatch.placeholder",
    originalUrl: "https://veritydispatch.placeholder/energy",
    publishedAt: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    fetchedAt: new Date().toISOString(),
    category: "Environment",
    subCategory: "Energy",
    region: "USA",
    language: "en",
    aiSummary: "Federal and private investments in overhauling the national power grid have reached an all-time high. The push is aimed at supporting the influx of renewable energy sources and electric vehicle adoption.",
    keyPoints: [
      "$50 billion allocated for grid modernization.",
      "New smart grid technologies to improve load balancing.",
      "Targeting 100% clean electricity by 2035."
    ],
    whyItMatters: "A modernized grid is the essential backbone for the green energy transition, determining the success of national climate goals.",
    tags: ["Energy", "Infrastructure", "Renewables"],
    importanceScore: 82,
    relevanceScore: 78,
    credibilityScore: 96,
    sentiment: "positive"
  }
];

export const mockBriefings: AI_Briefing[] = [
  {
    id: "b1",
    date: new Date().toISOString(),
    title: "Daily Global Geopolitics Briefing",
    briefingTitle: "Tensions and Treaties: The Global Arena Today",
    executiveSummary: "Today's geopolitical landscape is marked by stalled global trade discussions in Geneva and significant strides in Indo-Pacific defense cooperation. Meanwhile, the EU's aggressive AI regulatory push is setting the stage for global tech policy debates.",
    topStories: [
      {
        headline: "Global Trade Summit Deadlock",
        sources: ["World Desk", "Global Ledger"],
        summary: "Negotiations have paused as nations clash over renewable subsidies and tariffs. The outcome remains uncertain.",
        whyItMatters: "Could lead to fragmented supply chains in the crucial green technology sector.",
        whatToWatch: "Watch for potential compromises proposed by emerging economies tomorrow."
      },
      {
        headline: "Indo-Pacific Defense Coalitions Expand",
        sources: ["SignalWire News"],
        summary: "A new trilateral pact aims to secure maritime routes through joint patrols and intelligence sharing.",
        whyItMatters: "Shifts the strategic balance and aims to deter aggression in key shipping lanes.",
        whatToWatch: "Reactions from neighboring non-signatory nations in the coming days."
      },
      {
        headline: "Central Banks Signal Rate Cuts",
        sources: ["Global Ledger"],
        summary: "Inflation indicators show structural cooling, leading federal reserve governors to forecast potential rate cuts before year's end.",
        whyItMatters: "Cheaper capital could re-ignite tech VC funding and corporate M&A activity globally.",
        whatToWatch: "Next week's core CPI data release."
      },
      {
        headline: "EU Finalizes Comprehensive AI Act",
        sources: ["Atlas Brief"],
        summary: "The European Parliament has voted to approve the world's first comprehensive legal framework for artificial intelligence.",
        whyItMatters: "Creates a standard that multinational tech companies will likely adhere to globally to avoid fragmentation.",
        whatToWatch: "Implementation timelines and enforcement bodies."
      },
      {
        headline: "Energy Transition Grid Investments Soar",
        sources: ["Verity Dispatch"],
        summary: "Over $50 billion allocated globally this week for modernization of aging electrical grids to support vehicle electrification.",
        whyItMatters: "Critical bottleneck for EV adoption is being addressed, signaling long-term commodity shifts.",
        whatToWatch: "Copper and aluminum futures as physical infrastructure begins build-out."
      }
    ],
    keyThemes: ["Trade Tariffs", "Maritime Security", "AI Governance"],
    risks: ["Trade war escalation", "Regulatory fragmentation in tech"],
    opportunities: ["Clearer AI guidelines", "Stabilized Indo-Pacific shipping"]
  }
];
