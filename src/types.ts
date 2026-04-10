import { Timestamp } from 'firebase/firestore';

export interface Link {
  id: string;
  url: string;
  title: string;
  description?: string;
  tags: string[];
  userId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isFavorite: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
}
