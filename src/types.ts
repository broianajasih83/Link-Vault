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

export type ThemeColor = 'zinc' | 'slate' | 'stone' | 'orange' | 'blue' | 'rose' | 'green';
export type ThemeFont = 'sans' | 'display' | 'mono' | 'serif';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  themeColor?: ThemeColor;
  themeFont?: ThemeFont;
}
