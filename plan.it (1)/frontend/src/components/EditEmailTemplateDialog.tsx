import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
import { useUpdateEmailTemplate } from '@/hooks/useQueries';
import { EmailTemplate } from '@/backend';
import { toast } from 'sonner';

interface EditEmailTemplateDialogProps {
    template: EmailTemplate;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditEmailTemplateDialog({ template, open, onOpenChange }: EditEmailTemplateDialogProps) {
    const [title, setTitle] = useState(template.title);
    const [content, setContent] = useState(template.content);

    const updateTemplate = useUpdateEmailTemplate();

    useEffect(() => {
        if (open) {
            setTitle(template.title);
            setContent(template.content);
        }
    }, [open, template.id]); // Only depend on open and template.id

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent duplicate submissions
        if (updateTemplate.isPending) {
            return;
        }

        if (!title.trim() || !content.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            await updateTemplate.mutateAsync({
                id: template.id,
                title: title.trim(),
                content: content.trim(),
            });

            toast.success('Email template updated successfully');
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to update email template');
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Edit Email Template</DialogTitle>
                    <DialogDescription>
                        Update your email template content
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
                                disabled={updateTemplate.isPending}
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
                                disabled={updateTemplate.isPending}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Tip: You can use placeholders like [Client Name], [Event Name], [Event Date] in your template
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => onOpenChange(false)}
                            disabled={updateTemplate.isPending}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={updateTemplate.isPending} 
                            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                        >
                            {updateTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {updateTemplate.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
