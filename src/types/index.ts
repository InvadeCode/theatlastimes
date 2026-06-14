export interface Article {
  id: string;
  title: string;
  slug: string;
  sourceName: string;
  sourceUrl: string;
  originalUrl: string;
  imageUrl?: string;
  imageType?: string;
  imageSource?: string;
  imageLicense?: string;
  imageCredit?: string;
  imageCaption?: string;
  publishedAt: string;
  fetchedAt: string;
  category: string;
  subCategory?: string;
  region: string;
  country?: string;
  language: string;
  snippet?: string;
  aiSummary?: string;
  fullContent?: string;
  keyPoints?: string[];
  whyItMatters?: string;
  tags: string[];
  entities?: {
    people: string[];
    companies: string[];
    locations: string[];
    organizations: string[];
  };
  sentiment?: "positive" | "neutral" | "negative" | "mixed";
  importanceScore: number;
  relevanceScore: number;
  credibilityScore: number;
}

export interface UserPreference {
  userId: string;
  regions: string[];
  categories: string[];
  topics: string[];
  languages: string[];
  preferredTone: "neutral" | "analytical" | "simple" | "business";
  readingDepth: "quick" | "balanced" | "deep";
  blockedSources: string[];
  trustedSources: string[];
}

export interface AI_Briefing {
  id: string;
  date: string;
  title: string;
  briefingTitle: string;
  executiveSummary: string;
  topStories: {
    headline: string;
    sources: string[];
    summary: string;
    whyItMatters: string;
    whatToWatch: string;
  }[];
  keyThemes: string[];
  risks: string[];
  opportunities: string[];
}
