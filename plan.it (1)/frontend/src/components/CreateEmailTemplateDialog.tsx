import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateEmailTemplate } from '@/hooks/useQueries';
import { toast } from 'sonner';

interface CreateEmailTemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateEmailTemplateDialog({ open, onOpenChange }: CreateEmailTemplateDialogProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const createTemplate = useCreateEmailTemplate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            await createTemplate.mutateAsync({
                id: `template-${Date.now()}`,
                title: title.trim(),
                content: content.trim(),
            });

            toast.success('Email template created successfully');
            setTitle('');
            setContent('');
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to create email template');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create Email Template</DialogTitle>
                    <DialogDescription>
                        Create a reusable email template for client communication
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Template Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Event Confirmation, Menu Selection Request"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">Email Content</Label>
                            <Textarea
                                id="content"
                                placeholder="Enter your email template content here..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="min-h-[300px] resize-none"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Tip: You can use placeholders like [Client Name], [Event Name], [Event Date] in your template
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createTemplate.isPending} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                            {createTemplate.isPending ? 'Creating...' : 'Create Template'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
