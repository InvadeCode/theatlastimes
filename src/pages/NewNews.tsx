import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AVAILABLE_TAGS = ["Breaking", "Exclusive", "Popular", "Fresh", "Unclassified", "Analysis"];
const CATEGORIES = ["Geopolitics", "Economy", "Tech Policy", "Security", "Climate", "Technology", "World", "Finance", "Environment"];
const REGIONS = ["Global", "North America", "Europe", "Asia", "Middle East", "Africa", "Latin America"];

export default function NewNews() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('Geopolitics');
  const [region, setRegion] = useState('Global');
  const [sourceName, setSourceName] = useState('Atlas Desk');
  
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();

  const toggleTag = (tag: string) => {
      setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          const res = await fetch('/api/news', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  title,
                  fullContent: content,
                  summary,
                  category,
                  region,
                  sourceName,
                  tags,
              })
          });
          if (res.ok) {
              const resData = await res.json();
              navigate(`/article/${resData.data.id}`);
          }
      } catch (err) {
          console.error(err);
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8 border-b-4 border-foreground pb-4">
            <h1 className="text-4xl font-old-english font-bold capitalize text-foreground">Editorial Desk</h1>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold mt-2">Publish Intelligence Report</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-2">Headline</label>
                    <input 
                        type="text" 
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-transparent border-b border-border text-3xl font-serif py-2 focus:outline-none focus:border-foreground"
                        placeholder="Enter striking headline..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-muted-foreground">Category</label>
                        <select 
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-muted border border-border p-2 text-sm font-bold uppercase tracking-wider focus:outline-none"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-muted-foreground">Region</label>
                        <select 
                            value={region}
                            onChange={e => setRegion(e.target.value)}
                            className="w-full bg-muted border border-border p-2 text-sm font-bold uppercase tracking-wider focus:outline-none"
                        >
                            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-muted-foreground">Source Identity</label>
                        <input 
                            type="text" 
                            value={sourceName}
                            onChange={e => setSourceName(e.target.value)}
                            className="w-full bg-muted border border-border p-2 text-sm font-bold uppercase tracking-wider focus:outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-muted-foreground">Intel Tags</label>
                    <div className="flex flex-wrap gap-2">
                        {AVAILABLE_TAGS.map(tag => (
                            <button
                                type="button"
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1 text-xs font-bold uppercase tracking-widest border transition-colors ${
                                    tags.includes(tag) 
                                        ? 'bg-foreground text-background border-foreground' 
                                        : 'bg-transparent border-border text-foreground hover:bg-muted'
                                }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-2 mt-6">Executive Summary</label>
                    <textarea 
                        value={summary}
                        onChange={e => setSummary(e.target.value)}
                        rows={3}
                        className="w-full bg-muted/50 border border-border p-4 font-serif text-lg leading-relaxed focus:outline-none focus:border-foreground"
                        placeholder="Brief overview of the intelligence..."
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-2 mt-6">Full Report Content</label>
                    <textarea 
                        required
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={12}
                        className="w-full bg-transparent border border-border p-4 font-serif text-lg leading-relaxed focus:outline-none focus:border-foreground resize-y"
                        placeholder="Detailed analysis and intelligence data..."
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-foreground text-background px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? 'Publishing...' : 'Publish to World Wire'}
                </button>
            </div>
            
        </form>
    </div>
  )
}
