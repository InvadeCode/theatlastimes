import { createContext, useContext, useEffect, useState } from 'react';
import { User, signInAnonymously, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface UserContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        setLoading(false);
        // Initialize user doc if it doesn't exist
        const ref = doc(db, 'users', u.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
             email: u.email || 'Anonymous Reader',
             isAnonymous: true,
             createdAt: new Date().toISOString()
          }, { merge: true });
        }
      } else {
        // Auto-sign in anonymously if not authenticated
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed", error);
          setLoading(false);
        });
      }
    });
    return unsubscribe;
  }, []);

  const signIn = async () => {
    await signInAnonymously(auth);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <UserContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export const useAuth = () => useContext(UserContext);
