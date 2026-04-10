import { useState, useEffect, useMemo } from 'react';
import { auth, db, signInWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy, setDoc, getDocFromServer } from 'firebase/firestore';
import { Link, UserProfile } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LinkCard } from './components/LinkCard';
import { LinkTable } from './components/LinkTable';
import { AddLinkDialog } from './components/AddLinkDialog';
import { ThemeSettings } from './components/ThemeSettings';
import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog';
import { Toaster } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Share2,
  Settings,
  Trash2
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
  const [linkToDelete, setLinkToDelete] = useState<Link | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkTagDialogOpen, setIsBulkTagDialogOpen] = useState(false);
  const [bulkTag, setBulkTag] = useState('');

  // Apply theme to body
  useEffect(() => {
    if (userProfile) {
      const colorClass = `theme-${userProfile.themeColor || 'zinc'}`;
      const fontClass = `font-theme-${userProfile.themeFont || 'sans'}`;
      
      // Remove previous theme classes
      document.body.className = document.body.className
        .split(' ')
        .filter(c => !c.startsWith('theme-') && !c.startsWith('font-theme-'))
        .join(' ');
        
      document.body.classList.add(colorClass, fontClass);
    }
  }, [userProfile]);

  const handleFirestoreError = (error: unknown, operationType: string, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    return errInfo;
  };

  // Test connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        // Skip logging for other errors, as this is simply a connection test.
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
        try {
          // Ensure user profile exists
          const userRef = doc(db, 'users', user.uid);
          
          // Listen to user profile changes
          onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
              setUserProfile({ uid: snap.id, ...snap.data() } as UserProfile);
            }
          });

          const userSnap = await getDocFromServer(userRef).catch(() => null);
          
          if (!userSnap?.exists()) {
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: Timestamp.now(),
              themeColor: 'zinc',
              themeFont: 'sans'
            });
          }
        } catch (error) {
          handleFirestoreError(error, 'WRITE', `users/${user.uid}`);
        }
      } else {
        setUserProfile(null);
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
      handleFirestoreError(error, 'LIST', 'links');
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
      handleFirestoreError(error, 'WRITE', editingLink ? `links/${editingLink.id}` : 'links');
      toast.error("Failed to save link.");
    }
  };

  const handleDeleteLink = async () => {
    if (!linkToDelete) return;
    try {
      await deleteDoc(doc(db, 'links', linkToDelete.id));
      toast.success("Link deleted.");
      setIsDeleteDialogOpen(false);
      setLinkToDelete(null);
    } catch (error) {
      handleFirestoreError(error, 'DELETE', `links/${linkToDelete.id}`);
      toast.error("Failed to delete link.");
    }
  };

  const confirmDelete = (id: string) => {
    const link = links.find(l => l.id === id);
    if (link) {
      setLinkToDelete(link);
      setIsDeleteDialogOpen(true);
    }
  };

  const handleToggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      await updateDoc(doc(db, 'links', id), { isFavorite });
    } catch (error) {
      handleFirestoreError(error, 'UPDATE', `links/${id}`);
      toast.error("Failed to update favorite status.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const promises = selectedIds.map(id => deleteDoc(doc(db, 'links', id)));
      await Promise.all(promises);
      toast.success(`Deleted ${selectedIds.length} links.`);
      setSelectedIds([]);
    } catch (error) {
      handleFirestoreError(error, 'DELETE', 'bulk');
      toast.error("Failed to delete some links.");
    }
  };

  const handleBulkAddTag = async () => {
    if (selectedIds.length === 0 || !bulkTag.trim()) return;
    try {
      const tagToAdd = bulkTag.trim().toLowerCase();
      const promises = selectedIds.map(async (id) => {
        const link = links.find(l => l.id === id);
        if (link && !link.tags.includes(tagToAdd)) {
          await updateDoc(doc(db, 'links', id), {
            tags: [...link.tags, tagToAdd]
          });
        }
      });
      await Promise.all(promises);
      toast.success(`Added tag "${tagToAdd}" to ${selectedIds.length} links.`);
      setSelectedIds([]);
      setBulkTag('');
      setIsBulkTagDialogOpen(false);
    } catch (error) {
      handleFirestoreError(error, 'UPDATE', 'bulk');
      toast.error("Failed to update some links.");
    }
  };

  const updateTheme = async (color?: string, font?: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const updates: any = {};
      if (color) updates.themeColor = color;
      if (font) updates.themeFont = font;
      await updateDoc(userRef, updates);
      toast.success("Theme updated!");
    } catch (error) {
      handleFirestoreError(error, 'UPDATE', `users/${user.uid}`);
      toast.error("Failed to update theme.");
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
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)} className="rounded-xl text-zinc-500 hover:text-zinc-900">
              <Settings className="h-5 w-5" />
            </Button>
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

      {/* Bulk Actions Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-zinc-800"
          >
            <div className="flex items-center gap-3 pr-6 border-r border-zinc-700">
              <span className="bg-white text-zinc-900 text-xs font-black h-5 w-5 rounded-full flex items-center justify-center">
                {selectedIds.length}
              </span>
              <span className="text-sm font-bold">Selected</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-zinc-800 gap-2 h-9 px-4 rounded-xl"
                onClick={() => setIsBulkTagDialogOpen(true)}
              >
                <TagIcon className="h-4 w-4" />
                Add Tag
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-red-400 hover:bg-red-950/30 hover:text-red-400 gap-2 h-9 px-4 rounded-xl"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-zinc-400 hover:bg-zinc-800 h-9 px-4 rounded-xl"
                onClick={() => setSelectedIds([])}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 py-8 sm:px-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 space-y-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-900 to-zinc-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <Button 
              onClick={() => {
                setEditingLink(null);
                setIsAddDialogOpen(true);
              }} 
              className="relative w-full h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold shadow-xl transition-all gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
              <Plus className="h-5 w-5" />
              Add New Link
            </Button>
          </div>

          <div className="space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Total</p>
                <p className="text-2xl font-display font-black text-zinc-900 leading-none">{links.length}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Favorites</p>
                <p className="text-2xl font-display font-black text-zinc-900 leading-none">{links.filter(l => l.isFavorite).length}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 px-4">Collections</h3>
              <nav className="space-y-1">
                <button
                  onClick={() => setSelectedTab('all')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 h-12 rounded-xl transition-all font-medium text-sm",
                    selectedTab === 'all' 
                      ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
                      : "text-zinc-500 hover:bg-white hover:text-zinc-900"
                  )}
                >
                  <LayoutGrid className={cn("h-4 w-4", selectedTab === 'all' ? "text-white" : "text-zinc-400")} />
                  All Links
                  {selectedTab === 'all' && (
                    <motion.div layoutId="active-pill" className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </button>
                <button
                  onClick={() => setSelectedTab('favorites')}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 h-12 rounded-xl transition-all font-medium text-sm",
                    selectedTab === 'favorites' 
                      ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200" 
                      : "text-zinc-500 hover:bg-white hover:text-zinc-900"
                  )}
                >
                  <Star className={cn("h-4 w-4", selectedTab === 'favorites' ? "text-white" : "text-zinc-400")} />
                  Favorites
                  {selectedTab === 'favorites' && (
                    <motion.div layoutId="active-pill" className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                  )}
                </button>
              </nav>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Tags</h3>
                {selectedTag && (
                  <button 
                    onClick={() => setSelectedTag(null)} 
                    className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
              <ScrollArea className="h-[300px] px-2">
                <div className="flex flex-wrap gap-2 p-2">
                  {allTags.map(tag => (
                    <Badge 
                      key={tag} 
                      variant={selectedTag === tag ? "default" : "secondary"}
                      className={cn(
                        "cursor-pointer px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border-none",
                        selectedTag === tag 
                          ? "bg-zinc-900 text-white shadow-md" 
                          : "bg-white text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 shadow-sm"
                      )}
                      onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    >
                      <TagIcon className="h-3 w-3 mr-2 opacity-50" />
                      {tag}
                    </Badge>
                  ))}
                  {allTags.length === 0 && (
                    <div className="w-full py-8 text-center bg-zinc-100/50 rounded-2xl border border-dashed border-zinc-200">
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">No tags yet</p>
                    </div>
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
          ) : viewMode === 'grid' ? (
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredLinks.map((link) => (
                  <LinkCard 
                    key={link.id} 
                    link={link} 
                    onDelete={confirmDelete}
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
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <LinkTable 
                links={filteredLinks}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onDelete={confirmDelete}
                onToggleFavorite={handleToggleFavorite}
                onEdit={(link) => {
                  setEditingLink(link);
                  setIsAddDialogOpen(true);
                }}
                onShare={handleShare}
              />
            </motion.div>
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

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setLinkToDelete(null);
        }}
        onConfirm={handleDeleteLink}
        title={linkToDelete?.title || ''}
      />

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">Personalize LinkVault</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <ThemeSettings 
              currentColor={userProfile?.themeColor || 'zinc'}
              currentFont={userProfile?.themeFont || 'sans'}
              onColorChange={(color) => updateTheme(color, undefined)}
              onFontChange={(font) => updateTheme(undefined, font)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsSettingsOpen(false)} className="rounded-xl bg-zinc-900 px-8">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkTagDialogOpen} onOpenChange={setIsBulkTagDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">Add Tag to {selectedIds.length} Links</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Tag Name</label>
              <Input 
                placeholder="e.g. reading-list" 
                value={bulkTag}
                onChange={(e) => setBulkTag(e.target.value)}
                className="rounded-xl border-zinc-200 focus:ring-zinc-900"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsBulkTagDialogOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleBulkAddTag} className="rounded-xl bg-zinc-900 px-8">
              Add Tag
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
