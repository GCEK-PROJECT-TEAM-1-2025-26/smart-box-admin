import { User } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from './firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

export interface AuthUser extends FirebaseUser {
  role?: string;
}

export const signIn = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error: unknown) {
    return { user: null, error: error instanceof FirebaseError ? error.message : 'Failed to sign in' };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error: unknown) {
    return { error: error instanceof FirebaseError ? error.message : 'Failed to sign out' };
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const isAdmin = (user: User | null): boolean => {
  // In a real app, you would check user claims or database roles
  // For demo purposes, checking if email contains "admin"
  return user?.email?.includes('admin') ?? false;
};
