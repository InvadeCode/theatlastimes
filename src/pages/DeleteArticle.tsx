import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Article } from '../types';

export default function DeleteArticle() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/news/${id}`);
        if (res.ok) {
          const data = await res.json();
          setArticle(data.data);
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
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/news/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        navigate('/');
      } else {
        const errData = await res.text();
        console.error('Failed to delete article:', errData);
        alert('Failed to delete article: ' + errData);
      }
    } catch (err) {
      console.error('Error deleting article:', err);
      alert('Error deleting article');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center font-serif text-xl animate-pulse">Loading article...</div>;
  }

  if (!article) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto py-20 px-4">
      <div className="border border-border p-8 bg-card">
        <h1 className="text-3xl font-old-english font-bold text-foreground mb-4">Delete Article</h1>
        <p className="text-muted-foreground mb-8">
          Are you sure you want to delete this article? This action cannot be undone.
        </p>
        <div className="bg-muted p-4 mb-8 border border-border">
          <h2 className="font-serif text-xl font-bold mb-2">{article.title}</h2>
          <p className="text-sm text-muted-foreground">{article.aiSummary}</p>
        </div>
        <div className="flex justify-end gap-4">
          <button
            onClick={() => navigate(`/article/${id}`)}
            className="bg-muted text-foreground px-6 py-2 text-sm font-bold uppercase tracking-widest hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 text-white px-6 py-2 text-sm font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isDeleting ? 'Deleting...' : 'Delete Article'}
          </button>
        </div>
      </div>
    </div>
  );
}