'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
    onAuthStateChanged, 
    User, 
    signInWithEmailAndPassword, 
    signOut 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/app/firebase';

// Define role-specific data structures
interface UserData {
    role: 'user';
    email: string;
    favoritePharmacies?: string[];
    trackedMedications?: string[];
}

interface PharmacyData {
    role: 'pharmacist';
    name: string;
    address: string;
    phone: string;
    email: string;
    ownerUid: string;
}

// Unified user profile
type UserProfile = (UserData | PharmacyData) & { uid: string };

interface AuthContextType {
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  firebaseUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // User is signed in, let's fetch their profile from Firestore
        const pharmacistDocRef = doc(db, "pharmacies", user.uid);
        const pharmacistDocSnap = await getDoc(pharmacistDocRef);

        if (pharmacistDocSnap.exists()) {
          setUserProfile({ uid: user.uid, ...pharmacistDocSnap.data() } as UserProfile);
        } else {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserProfile({ uid: user.uid, ...userDocSnap.data() } as UserProfile);
          } else {
            // This case might happen if a user is created in Auth but not in Firestore
            setUserProfile(null); 
          }
        }
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);





  const login = async (email: string, password: string): Promise<UserProfile> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch profile from Firestore
    const pharmacistDocRef = doc(db, "pharmacies", user.uid);
    const pharmacistDocSnap = await getDoc(pharmacistDocRef);

    let profile: UserProfile;

    if (pharmacistDocSnap.exists()) {
      profile = { uid: user.uid, ...pharmacistDocSnap.data() } as UserProfile;
    } else {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        profile = { uid: user.uid, ...userDocSnap.data() } as UserProfile;
      } else {
        // This should not happen in a normal login flow, but as a fallback
        await signOut(auth);
        throw new Error("User profile not found in Firestore.");
      }
    }
    
    setUserProfile(profile);
    return profile;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    firebaseUser,
    userProfile,
    setUserProfile, // <-- Add this
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
