import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered } from 'lucide-react';
import { Article } from '../types';

const AVAILABLE_TAGS = ["Breaking", "Exclusive", "Popular", "Fresh", "Unclassified", "Analysis"];
const CATEGORIES = ["Geopolitics", "Economy", "Tech Policy", "Security", "Climate", "Technology", "World", "Finance", "Environment"];
const REGIONS = ["Global", "North America", "Europe", "Asia", "Middle East", "Africa", "Latin America"];

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-muted/50 border border-border border-b-0">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}
      >
        <Italic className="w-4 h-4" />
      </button>
      <div className="w-[1px] h-6 bg-border mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}
      >
        <Heading3 className="w-4 h-4" />
      </button>
      <div className="w-[1px] h-6 bg-border mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}
      >
        <ListOrdered className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function EditArticle() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('Geopolitics');
  const [region, setRegion] = useState('Global');
  const [sourceName, setSourceName] = useState('Atlas Desk');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
    editorProps: {
      attributes: {
         class: 'w-full min-h-[350px] bg-transparent border border-border p-4 focus:outline-none focus:border-foreground article-content [&>p]:mb-6 [&>p]:font-serif [&>p]:text-xl [&>p]:leading-relaxed [&>p]:text-foreground/90 [&>h1]:text-4xl [&>h1]:font-bold [&>h1]:mt-10 [&>h1]:mb-4 [&>h1]:font-serif [&>h2]:text-3xl [&>h2]:font-bold [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:font-serif [&>h3]:text-2xl [&>h3]:font-bold [&>h3]:mt-6 [&>h3]:mb-4 [&>h3]:font-serif [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>ul>li]:mb-2 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6 [&>ol>li]:mb-2 [&_strong]:font-black',
      },
    },
  });

  useEffect(() => {
    if (!id) return;
    
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/news/${id}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data.data);
          setTitle(data.data.title);
          setContent(data.data.fullContent);
          setSummary(data.data.aiSummary);
          setCategory(data.data.category);
          setRegion(data.data.region);
          setSourceName(data.data.sourceName);
          setImageUrl(data.data.imageUrl || '');
          setTags(data.data.tags || []);
          
          if (editor) {
            editor.commands.setContent(data.data.fullContent);
          }
        } else {
          alert('Article not found');
          navigate('/');
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        alert('Error fetching article');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticle();
  }, [id, navigate, editor]);

  const toggleTag = (tag: string) => {
      setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim() || !id) {
          alert("Please enter a headline before publishing.");
          return;
      }
      setIsSubmitting(true);
      try {
          const res = await fetch(`/api/news/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  title,
                  fullContent: content,
                  summary,
                  category,
                  region,
                  sourceName,
                  tags,
                  imageUrl: imageUrl.trim() || undefined,
              })
          });
          if (res.ok) {
              const resData = await res.json();
              navigate(`/article/${resData.data.id}`);
          } else {
              const errData = await res.text();
              console.error("Failed to update:", errData);
              alert("Failed to update article: " + errData);
          }
      } catch (err) {
          console.error("Error during form submit:", err);
          alert("Error updating article: " + err);
      } finally {
          setIsSubmitting(false);
      }
  };

  if (loading) {
    return <div className="py-20 text-center font-serif text-xl animate-pulse">Loading article...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-8 border-b-4 border-foreground pb-4">
            <h1 className="text-4xl font-old-english font-bold capitalize text-foreground">Edit Article</h1>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold mt-2">Update intelligence report</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-2">Headline</label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-transparent border-b border-border text-3xl font-serif py-2 focus:outline-none focus:border-foreground"
                        placeholder="Enter striking headline..."
                    />
                </div>

                <div>
                    <label className="block text-xs uppercase tracking-widest font-bold mb-2 text-muted-foreground">Cover Image URL (Optional)</label>
                    <input 
                        type="url" 
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                        className="w-full bg-muted border border-border p-2 text-sm focus:outline-none placeholder:text-muted-foreground/50"
                        placeholder="https://images.unsplash.com/..."
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
                    <div className="flex flex-col">
                        <MenuBar editor={editor} />
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-4">
                <button 
                    type="button"
                    onClick={() => navigate(`/article/${id}`)}
                    className="bg-muted text-foreground px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-muted/80 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-foreground text-background px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
            
        </form>
    </div>
  )
}