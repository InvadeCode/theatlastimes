import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/useAuth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Preferences() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedRegions, setSelectedRegions] = useState<string[]>(["Global", "USA", "Europe"]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Business", "Technology"]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      if (user) {
         try {
           const ref = doc(db, 'users', user.uid);
           const snap = await getDoc(ref);
           if (snap.exists() && snap.data().preferences) {
              const prefs = snap.data().preferences;
              if (prefs.regions) setSelectedRegions(prefs.regions);
              if (prefs.categories) setSelectedCategories(prefs.categories);
           }
         } catch(e) {}
      }
    }
    loadPreferences();
  }, [user]);

  const regions = ["Global", "APAC", "EMEA", "Americas", "Middle East", "Africa", "USA", "Europe"];
  const categories = ["Business", "Technology", "Geopolitics", "Economy", "Markets", "Policy", "Science"];

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
      if (list.includes(item)) setList(list.filter(i => i !== item));
      else setList([...list, item]);
  };

  const handleSave = async () => {
      if (!user) {
          navigate("/");
          return;
      }
      setSaving(true);
      try {
         await setDoc(doc(db, 'users', user.uid), {
             preferences: {
                 regions: selectedRegions,
                 categories: selectedCategories
             }
         }, { merge: true });
      } catch (e) {}
      navigate("/");
  };

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="border-b-4 border-foreground pb-4 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <h1 className="text-4xl md:text-5xl font-serif font-black uppercase tracking-widest text-foreground">Edition Settings</h1>
        </div>

        <div className="mb-12">
            <h2 className="text-lg font-bold uppercase tracking-widest border-b border-border pb-4 mb-6">Regional Focus</h2>
            <div className="flex flex-wrap gap-4">
                {regions.map(r => (
                    <button 
                       key={r} 
                       onClick={() => toggleItem(selectedRegions, setSelectedRegions, r)}
                       className={`px-6 py-2 border font-bold uppercase text-xs tracking-widest transition-colors ${selectedRegions.includes(r) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-border text-foreground/80'}`}
                    >
                        {r}
                    </button>
                ))}
            </div>
        </div>

        <div className="mb-12">
            <h2 className="text-lg font-bold uppercase tracking-widest border-b border-border pb-4 mb-6">Subject Interests</h2>
            <div className="flex flex-wrap gap-4">
                {categories.map(c => (
                    <button 
                       key={c} 
                       onClick={() => toggleItem(selectedCategories, setSelectedCategories, c)}
                       className={`px-6 py-2 border font-bold uppercase text-xs tracking-widest transition-colors ${selectedCategories.includes(c) ? 'bg-foreground text-background border-foreground' : 'bg-background hover:bg-muted border-border text-foreground/80'}`}
                    >
                        {c}
                    </button>
                ))}
            </div>
        </div>

        <div className="mt-16 border-t border-border pt-8 flex justify-end items-center">
            <button onClick={handleSave} disabled={saving} className="inline-block bg-primary text-primary-foreground px-10 py-4 font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity shadow-sm">
                {saving ? "Saving..." : "Save Preferences"}
            </button>
        </div>
    </div>
  )
}
