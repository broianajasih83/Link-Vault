import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

export function DeleteConfirmationDialog({ isOpen, onClose, onConfirm, title }: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl border-none shadow-2xl">
        <DialogHeader className="flex flex-col items-center gap-4 pt-4">
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div className="text-center space-y-2">
            <DialogTitle className="text-xl font-display font-bold">Delete Link?</DialogTitle>
            <DialogDescription className="text-zinc-500">
              Are you sure you want to delete <span className="font-bold text-zinc-900">"{title}"</span>? This action cannot be undone.
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="flex sm:justify-center gap-3 mt-4 pb-4">
          <Button variant="ghost" onClick={onClose} className="rounded-xl flex-1 font-medium">
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="rounded-xl flex-1 font-medium bg-red-500 hover:bg-red-600">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
