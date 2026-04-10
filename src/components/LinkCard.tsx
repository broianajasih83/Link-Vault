import { Link } from '@/src/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Trash2, Heart, Share2, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface LinkCardProps {
  link: Link;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onEdit: (link: Link) => void;
  onShare: (link: Link) => void;
}

export function LinkCard({ link, onDelete, onToggleFavorite, onEdit, onShare }: LinkCardProps) {
  const hostname = new URL(link.url).hostname;
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <Card className="h-full flex flex-col overflow-hidden border-zinc-200 hover:border-zinc-300 transition-all shadow-sm hover:shadow-md">
        {/* Preview Area */}
        <div className="relative h-32 bg-zinc-100 overflow-hidden border-b border-zinc-100">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-zinc-200 opacity-50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="relative z-10 h-16 w-16 rounded-2xl bg-white shadow-xl flex items-center justify-center p-3 border border-zinc-100 transition-transform group-hover:scale-110"
            >
              <img 
                src={faviconUrl} 
                alt={hostname} 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
          {/* Decorative elements to simulate a browser/content preview */}
          <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-20">
            <div className="h-1 w-1/3 bg-zinc-400 rounded-full" />
            <div className="h-1 w-1/4 bg-zinc-400 rounded-full" />
            <div className="h-1 w-1/6 bg-zinc-400 rounded-full" />
          </div>
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-zinc-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-white/50 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-900">Preview</span>
            </div>
          </div>
        </div>

        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg font-display font-semibold line-clamp-2 leading-tight group-hover:text-zinc-900 transition-colors">
              {link.title}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 shrink-0 rounded-full transition-colors",
                link.isFavorite ? "text-red-500 hover:text-red-600 bg-red-50" : "text-zinc-400 hover:text-red-500"
              )}
              onClick={() => onToggleFavorite(link.id, !link.isFavorite)}
            >
              <Heart className={cn("h-4 w-4", link.isFavorite && "fill-current")} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {link.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-zinc-100 text-zinc-600 hover:bg-zinc-200 border-none text-[10px] uppercase tracking-wider font-semibold">
                {tag}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="flex-grow pb-4">
          <p className="text-sm text-zinc-500 line-clamp-3 leading-relaxed">
            {link.description || "No description provided."}
          </p>
          <div className="mt-4 flex items-center text-xs text-zinc-400 font-mono">
            <span className="truncate">{hostname}</span>
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex justify-between gap-2 border-t border-zinc-50 bg-zinc-50/50 mt-auto">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900" onClick={() => onEdit(link)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900" onClick={() => onShare(link)}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-600" onClick={() => onDelete(link.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <a 
            href={link.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={cn(
              "inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-50 transition-colors gap-1.5 h-8"
            )}
          >
            Open <ExternalLink className="h-3 w-3" />
          </a>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
