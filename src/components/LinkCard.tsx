import { Link } from '@/src/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { ExternalLink, Trash2, Heart, Share2, Edit2, CalendarDays, Globe } from 'lucide-react';
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
  const screenshotUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(link.url)}?w=800`;
  
  const formattedDate = link.createdAt?.toDate().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    day: 'numeric'
  });

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
      <Card className="h-full flex flex-col overflow-hidden border-zinc-200 hover:border-zinc-300 transition-all shadow-sm hover:shadow-md bg-white">
        {/* Preview Area */}
        <div className="relative h-40 bg-zinc-100 overflow-hidden border-b border-zinc-100">
          <div className="absolute inset-0 bg-zinc-200 animate-pulse" />
          <img 
            src={screenshotUrl} 
            alt={link.title}
            className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            onLoad={(e) => {
              (e.target as HTMLImageElement).previousElementSibling?.classList.add('hidden');
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${hostname}/800/400?blur=10`;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Floating Favicon */}
          <div className="absolute bottom-3 left-3 z-10">
            <div className="h-8 w-8 rounded-lg bg-white shadow-lg flex items-center justify-center p-1.5 border border-zinc-100">
              <img 
                src={faviconUrl} 
                alt="" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          
          {/* Quick View Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-white/50 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-900 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Live Preview</span>
            </div>
          </div>
        </div>

        <CardHeader className="pb-2">
          <div className="flex justify-between items-start gap-2">
            <HoverCard>
              <HoverCardTrigger>
                <CardTitle className="text-lg font-display font-bold line-clamp-2 leading-tight group-hover:text-zinc-900 transition-colors cursor-help decoration-zinc-200 underline-offset-4 hover:underline">
                  {link.title}
                </CardTitle>
              </HoverCardTrigger>
              <HoverCardContent className="w-96 rounded-3xl shadow-2xl border-none p-0 overflow-hidden bg-white ring-1 ring-zinc-200">
                <div className="relative h-48 bg-zinc-900">
                  <img 
                    src={screenshotUrl} 
                    alt="" 
                    className="w-full h-full object-cover object-top opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-xl bg-white p-2 flex items-center justify-center shadow-xl">
                        <img src={faviconUrl} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Verified Source</span>
                        <span className="text-sm font-bold text-white truncate max-w-[200px]">{hostname}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-xl font-display font-bold leading-tight text-zinc-900">{link.title}</h4>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      {link.description || "No detailed description available for this link."}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {link.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-zinc-100 text-zinc-600 border-none text-[10px] uppercase font-bold px-2.5 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <CalendarDays className="h-4 w-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{formattedDate}</span>
                    </div>
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-xl h-9 px-4 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                    >
                      Visit Website <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
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
            <Globe className="h-3 w-3 mr-1.5 opacity-50" />
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
