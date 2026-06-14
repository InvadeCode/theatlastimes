import { Article } from "../types";

export function generateFallbackArticles(count: number): Article[] {
  const articles: Article[] = [];
  const categories = ["Geopolitics", "Defense", "Economy", "Trade", "Energy", "Tech Policy", "Security", "Finance", "Global Affairs"];
  const regions = ["Global", "APAC", "EMEA", "Americas", "Middle East", "Africa", "USA", "Europe"];
  const sentiments: ("positive" | "neutral" | "negative" | "mixed")[] = ["positive", "neutral", "negative", "mixed"];
  
  const subjects = ["Trade Tariffs", "Semiconductor Sanctions", "Renewable Subsidy", "Naval Pacts", "Interest Rates", "Generative AI", "Supply Chain", "Election Cycle", "Cyber Security", "Energy Transition", "Space Race"];
  const images = [
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1568992687947-868a62a9f521?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1529400971008-f566de0e6b22?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1525011268546-bf3f9b007f6a?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1559136555-9ce7f4952044?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800"
  ];
  const actors = ["EU", "US", "China", "India", "Middle East Coalition", "ASEAN", "OPEC+", "NATO", "BRICS", "UN"];
  
  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const region = regions[i % regions.length];
    const subject = subjects[i % subjects.length];
    const actor = actors[i % actors.length];
    const sentiment = sentiments[i % sentiments.length];
    const image = images[Math.floor((i * 7) % images.length)];
    
    // Distribute times over the last 7 days
    const timeOffsetMs = Math.floor(Math.random() * (7 * 24 * 60 * 60 * 1000));
    const publishedAt = new Date(Date.now() - timeOffsetMs).toISOString();
    
    articles.push({
      id: `fallback-${i}`,
      title: `${actor} Announces New Stance on ${subject} in Strategic Shift`,
      slug: `fallback-${actor.toLowerCase()}-${subject.toLowerCase().replace(/ /g, '-')}-${i}`,
      sourceName: "Atlas Core Archives",
      sourceUrl: "https://atlasbrief.placeholder",
      originalUrl: "https://atlasbrief.placeholder",
      publishedAt: publishedAt,
      fetchedAt: new Date().toISOString(),
      category: category,
      region: region,
      language: "en",
      aiSummary: `In a move that caught analysts by surprise, ${actor} has formally outlined a revised framework concerning ${subject}. This pivot signals a broader recalibration of ${region} strategies, likely to impact ${category} and beyond over the coming quarters. Market participants are closely watching the implementation phases.`,
      keyPoints: [
        `${actor} formalizes new doctrine on ${subject}.`,
        `Immediate regional implications for ${region}.`,
        `Long-term impacts expected across the ${category} sector.`
      ],
      whyItMatters: `This policy realignment directly impacts the stability and future planning of ${category} markets. Stakeholders in ${region} must prepare for immediate regulatory shifts and altered supply dynamics.`,
      tags: [subject, actor, region],
      importanceScore: 60 + Math.floor(Math.random() * 40),
      relevanceScore: 60 + Math.floor(Math.random() * 40),
      credibilityScore: 90,
      sentiment: "neutral",
      imageUrl: image
    });
  }
  
  // Sort by date descending
  return articles.sort((a,b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}
