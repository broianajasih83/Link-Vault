import { useState, useEffect, useMemo } from 'react';
import { auth, db, signInWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy, setDoc, getDocFromServer } from 'firebase/firestore';
import { Link, UserProfile } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LinkCard } from './components/LinkCard';
import { AddLinkDialog } from './components/AddLinkDialog';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  LogOut, 
  LayoutGrid, 
  List, 
  Bookmark, 
  Tag as TagIcon, 
  Filter, 
  Star,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

import { cn } from '@/lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Test connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setIsAuthReady(true);
      if (user) {
        // Ensure user profile exists
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: Timestamp.now()
        }, { merge: true });
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setLinks([]);
      return;
    }

    const q = query(
      collection(db, 'links'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const linksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Link[];
      setLinks(linksData);
    }, (error) => {
      console.error("Firestore Error:", error);
      toast.error("Failed to fetch links. Check your permissions.");
    });

    return unsubscribe;
  }, [user]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    links.forEach(link => link.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [links]);

  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      const matchesSearch = 
        link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        link.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTab = 
        selectedTab === 'all' || 
        (selectedTab === 'favorites' && link.isFavorite);
      
      const matchesTag = !selectedTag || link.tags?.includes(selectedTag);

      return matchesSearch && matchesTab && matchesTag;
    });
  }, [links, searchQuery, selectedTab, selectedTag]);

  const handleSaveLink = async (linkData: Partial<Link>) => {
    if (!user) return;

    try {
      if (editingLink) {
        await updateDoc(doc(db, 'links', editingLink.id), {
          ...linkData,
          updatedAt: Timestamp.now()
        });
        toast.success("Link updated successfully!");
      } else {
        await addDoc(collection(db, 'links'), {
          ...linkData,
          userId: user.uid,
          createdAt: Timestamp.now(),
          isFavorite: false
        });
        toast.success("Link saved successfully!");
      }
      setEditingLink(null);
    } catch (error) {
      console.error("Error saving link:", error);
      toast.error("Failed to save link.");
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'links', id));
      toast.success("Link deleted.");
    } catch (error) {
      toast.error("Failed to delete link.");
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      await updateDoc(doc(db, 'links', id), { isFavorite });
    } catch (error) {
      toast.error("Failed to update favorite status.");
    }
  };

  const handleShare = (link: Link) => {
    if (navigator.share) {
      navigator.share({
        title: link.title,
        text: link.description,
        url: link.url,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(link.url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-12 w-12 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg">
            <Bookmark className="text-white h-6 w-6" />
          </div>
          <p className="text-zinc-400 font-medium animate-pulse">Loading LinkVault...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="h-20 w-20 rounded-[2rem] bg-zinc-900 flex items-center justify-center shadow-2xl rotate-12">
              <Bookmark className="text-white h-10 w-10 -rotate-12" />
            </div>
            <h1 className="text-5xl font-display font-black tracking-tight text-zinc-900 mt-4">LinkVault</h1>
            <p className="text-zinc-500 text-lg max-w-xs mx-auto leading-relaxed">
              Organize your digital world. Save, tag, and find your links instantly.
            </p>
          </div>
          
          <Button 
            onClick={signInWithGoogle} 
            size="lg" 
            className="w-full h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all gap-3"
          >
            <Globe className="h-5 w-5" />
            Sign in with Google
          </Button>

          <div className="pt-8 grid grid-cols-3 gap-4 opacity-20 grayscale">
            <div className="h-1 bg-zinc-400 rounded-full" />
            <div className="h-1 bg-zinc-400 rounded-full" />
            <div className="h-1 bg-zinc-400 rounded-full" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <Toaster position="top-center" richColors />
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center shadow-md">
              <Bookmark className="text-white h-5 w-5" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight hidden sm:block">LinkVault</h1>
          </div>

          <div className="flex-grow max-w-2xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search links, tags, or descriptions..." 
              className="pl-10 h-11 bg-zinc-100/50 border-none rounded-xl focus-visible:ring-zinc-900 focus-visible:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-3 mr-4">
              <img src={user.photoURL || ''} alt={user.displayName || ''} className="h-8 w-8 rounded-full border border-zinc-200" />
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-none">{user.displayName}</span>
                <span className="text-[10px] text-zinc-400">{user.email}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="rounded-xl text-zinc-500 hover:text-red-600 hover:bg-red-50">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 sm:px-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          <Button 
            onClick={() => {
              setEditingLink(null);
              setIsAddDialogOpen(true);
            }} 
            className="w-full h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold shadow-lg hover:shadow-xl transition-all gap-2"
          >
            <Plus className="h-5 w-5" />
            Add New Link
          </Button>

          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-2">Collections</h3>
              <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                <TabsList className="flex flex-col h-auto bg-transparent p-0 gap-1">
                  <TabsTrigger value="all" className="w-full justify-start gap-3 px-3 h-11 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-zinc-900 text-zinc-500 transition-all border-none">
                    <LayoutGrid className="h-4 w-4" /> All Links
                  </TabsTrigger>
                  <TabsTrigger value="favorites" className="w-full justify-start gap-3 px-3 h-11 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-zinc-900 text-zinc-500 transition-all border-none">
                    <Star className="h-4 w-4" /> Favorites
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Tags</h3>
                {selectedTag && (
                  <button onClick={() => setSelectedTag(null)} className="text-[10px] text-zinc-400 hover:text-zinc-900 underline">Clear</button>
                )}
              </div>
              <ScrollArea className="h-[300px] pr-4">
                <div className="flex flex-wrap gap-2 p-1">
                  {allTags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant={selectedTag === tag ? "default" : "secondary"}
                      className={cn(
                        "cursor-pointer px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all",
                        selectedTag === tag ? "bg-zinc-900 text-white" : "bg-white text-zinc-500 hover:bg-zinc-100 border border-zinc-200"
                      )}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    >
                      <TagIcon className="h-3 w-3 mr-1.5 opacity-50" />
                      {tag}
                    </Badge>
                  ))}
                  {allTags.length === 0 && (
                    <p className="text-xs text-zinc-400 italic px-2">No tags yet.</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-grow space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-display font-black text-zinc-900">
                {selectedTab === 'all' ? 'Your Library' : 'Favorites'}
              </h2>
              <span className="text-zinc-400 font-mono text-sm">({filteredLinks.length})</span>
            </div>
            
            <div className="flex bg-zinc-200/50 p-1 rounded-xl">
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8 rounded-lg"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="icon" 
                className="h-8 w-8 rounded-lg"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {filteredLinks.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center space-y-4"
            >
              <div className="h-20 w-20 rounded-full bg-zinc-100 flex items-center justify-center">
                <Search className="h-10 w-10 text-zinc-300" />
              </div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-zinc-900">No links found</p>
                <p className="text-zinc-500 max-w-xs">Try adjusting your search or filters, or add a new link to your vault.</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedTag(null);
                  setSelectedTab('all');
                }}
                className="rounded-xl"
              >
                Clear all filters
              </Button>
            </motion.div>
          ) : (
            <div className={cn(
              "grid gap-6",
              viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
            )}>
              <AnimatePresence mode="popLayout">
                {filteredLinks.map((link) => (
                  <LinkCard 
                    key={link.id} 
                    link={link} 
                    onDelete={handleDeleteLink}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={(link) => {
                      setEditingLink(link);
                      setIsAddDialogOpen(true);
                    }}
                    onShare={handleShare}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      <AddLinkDialog 
        isOpen={isAddDialogOpen} 
        onClose={() => {
          setIsAddDialogOpen(false);
          setEditingLink(null);
        }}
        onSave={handleSaveLink}
        editingLink={editingLink}
      />

      <footer className="border-t border-zinc-200 bg-white py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <Bookmark className="text-white h-4 w-4" />
            </div>
            <span className="font-display font-bold text-lg">LinkVault</span>
          </div>
          
          <div className="flex gap-6 text-zinc-400">
            <a href="#" className="hover:text-zinc-900 transition-colors"><Twitter className="h-5 w-5" /></a>
            <a href="#" className="hover:text-zinc-900 transition-colors"><Github className="h-5 w-5" /></a>
            <a href="#" className="hover:text-zinc-900 transition-colors"><Linkedin className="h-5 w-5" /></a>
            <a href="#" className="hover:text-zinc-900 transition-colors"><Mail className="h-5 w-5" /></a>
          </div>

          <p className="text-xs text-zinc-400 font-medium">
            &copy; 2026 LinkVault. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
