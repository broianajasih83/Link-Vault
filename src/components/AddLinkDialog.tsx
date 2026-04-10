import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from '@/src/types';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface AddLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (linkData: Partial<Link>) => void;
  editingLink?: Link | null;
}

export function AddLinkDialog({ isOpen, onClose, onSave, editingLink }: AddLinkDialogProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (editingLink) {
      setUrl(editingLink.url);
      setTitle(editingLink.title);
      setDescription(editingLink.description || '');
      setTags(editingLink.tags || []);
    } else {
      setUrl('');
      setTitle('');
      setDescription('');
      setTags([]);
    }
  }, [editingLink, isOpen]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !title) return;
    onSave({ url, title, description, tags });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold">
            {editingLink ? 'Edit Link' : 'Save New Link'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-xs font-bold uppercase tracking-wider text-zinc-500">URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="rounded-xl border-zinc-200 focus:ring-zinc-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Title</Label>
            <Input
              id="title"
              placeholder="My Awesome Link"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-xl border-zinc-200 focus:ring-zinc-900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="What is this link about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border-zinc-200 focus:ring-zinc-900"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="rounded-xl border-zinc-200 focus:ring-zinc-900"
              />
              <Button type="button" onClick={handleAddTag} variant="secondary" className="rounded-xl px-3">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-1 gap-1 rounded-lg bg-zinc-100 text-zinc-700 border-none">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 rounded-full p-0.5 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="rounded-xl font-medium">
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl bg-zinc-900 hover:bg-zinc-800 px-8 font-medium">
              {editingLink ? 'Update Link' : 'Save Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
