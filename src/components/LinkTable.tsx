import { Link } from '@/src/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ExternalLink, Trash2, Heart, Share2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface LinkTableProps {
  links: Link[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onEdit: (link: Link) => void;
  onShare: (link: Link) => void;
}

export function LinkTable({ links, selectedIds, onSelectionChange, onDelete, onToggleFavorite, onEdit, onShare }: LinkTableProps) {
  const toggleAll = () => {
    if (selectedIds.length === links.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(links.map(l => l.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-zinc-50/50">
          <TableRow className="hover:bg-transparent border-zinc-100">
            <TableHead className="w-[40px] px-4">
              <Checkbox 
                checked={links.length > 0 && selectedIds.length === links.length}
                onCheckedChange={toggleAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead className="font-bold text-zinc-900">Title & Description</TableHead>
            <TableHead className="font-bold text-zinc-900 hidden md:table-cell">Tags</TableHead>
            <TableHead className="font-bold text-zinc-900 hidden lg:table-cell">Source</TableHead>
            <TableHead className="text-right font-bold text-zinc-900">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links.map((link) => (
            <TableRow 
              key={link.id} 
              className={cn(
                "group border-zinc-50 hover:bg-zinc-50/50 transition-colors",
                selectedIds.includes(link.id) && "bg-zinc-50"
              )}
            >
              <TableCell className="px-4">
                <Checkbox 
                  checked={selectedIds.includes(link.id)}
                  onCheckedChange={() => toggleOne(link.id)}
                  aria-label={`Select ${link.title}`}
                />
              </TableCell>
              <TableCell>
                <button
                  onClick={() => onToggleFavorite(link.id, !link.isFavorite)}
                  className={cn(
                    "transition-colors",
                    link.isFavorite ? "text-red-500" : "text-zinc-300 hover:text-red-400"
                  )}
                >
                  <Heart className={cn("h-4 w-4", link.isFavorite && "fill-current")} />
                </button>
              </TableCell>
              <TableCell className="max-w-[300px]">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-zinc-900 line-clamp-1">{link.title}</span>
                  <span className="text-xs text-zinc-500 line-clamp-1">{link.description || "No description"}</span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex flex-wrap gap-1">
                  {link.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-zinc-100 text-zinc-600 border-none text-[9px] uppercase font-bold px-1.5 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {link.tags.length > 3 && (
                    <span className="text-[10px] text-zinc-400 font-medium">+{link.tags.length - 3}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div className="flex items-center gap-2">
                  <img 
                    src={`https://www.google.com/s2/favicons?domain=${new URL(link.url).hostname}&sz=32`} 
                    alt="" 
                    className="h-4 w-4 rounded-sm"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-xs text-zinc-400 font-mono truncate max-w-[120px]">
                    {new URL(link.url).hostname}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900" onClick={() => onEdit(link)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900" onClick={() => onShare(link)}>
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600" onClick={() => onDelete(link.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <a 
                    href={link.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={cn(
                      "inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white size-8 text-zinc-400 hover:text-zinc-900 transition-colors ml-1"
                    )}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
