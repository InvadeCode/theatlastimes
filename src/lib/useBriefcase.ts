import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export function useBriefcase() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    async function sync() {
      if (user) {
        // sync from firestore
        try {
          const docRef = doc(db, "briefcases", user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
             const fbSaved = snap.data().savedIds || [];
             setSavedIds(fbSaved);
             localStorage.setItem("briefcase", JSON.stringify(fbSaved));
          } else {
             // upload local
             const local = JSON.parse(localStorage.getItem("briefcase") || "[]");
             setSavedIds(local);
             await setDoc(docRef, { savedIds: local }, { merge: true });
          }
        } catch(e) { }
      } else {
        try {
           const saved = JSON.parse(localStorage.getItem("briefcase") || "[]");
           setSavedIds(saved);
        } catch(e) {}
      }
    }
    sync();
  }, [user]);

  const saveArticle = (id: string) => {
    if (savedIds.includes(id)) return;
    const updated = [...savedIds, id];
    setSavedIds(updated);
    localStorage.setItem("briefcase", JSON.stringify(updated));
    if (user) {
       setDoc(doc(db, "briefcases", user.uid), { savedIds: updated }, { merge: true }).catch(console.error);
    }
  };

  const removeArticle = (id: string) => {
    const updated = savedIds.filter(i => i !== id);
    setSavedIds(updated);
    localStorage.setItem("briefcase", JSON.stringify(updated));
    if (user) {
       setDoc(doc(db, "briefcases", user.uid), { savedIds: updated }, { merge: true }).catch(console.error);
    }
  };
  
  const isSaved = (id: string) => savedIds.includes(id);

  return { savedIds, saveArticle, removeArticle, isSaved };
}
