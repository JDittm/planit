import { useState } from 'react';
import { Plus, Mail, Edit, Trash2, Search, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetAllEmailTemplates, useDeleteEmailTemplate } from '@/hooks/useQueries';
import CreateEmailTemplateDialog from './CreateEmailTemplateDialog';
import EditEmailTemplateDialog from './EditEmailTemplateDialog';
import { EmailTemplate } from '@/backend';
import { toast } from 'sonner';

export default function EmailTemplates() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const { data: templates = [], isLoading } = useGetAllEmailTemplates();
    const deleteTemplate = useDeleteEmailTemplate();

    const filteredTemplates = templates.filter(template =>
        template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = async (id: string, title: string) => {
        if (window.confirm(`Are you sure you want to delete the template "${title}"?`)) {
            try {
                await deleteTemplate.mutateAsync(id);
                toast.success('Template deleted successfully');
            } catch (error) {
                toast.error('Failed to delete template');
            }
        }
    };

    const handleCopy = async (content: string, id: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedId(id);
            toast.success('Template copied to clipboard');
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            toast.error('Failed to copy template');
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground">Loading templates...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-primary" />
                                Email Templates
                            </CardTitle>
                            <CardDescription>
                                Create and manage reusable email templates for client communication
                            </CardDescription>
                        </div>
                        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                            <Plus className="mr-2 h-4 w-4" />
                            New Template
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search templates..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {filteredTemplates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Mail className="mb-4 h-16 w-16 text-muted-foreground/20" />
                            <h3 className="mb-2 text-lg font-semibold">No templates found</h3>
                            <p className="mb-4 text-sm text-muted-foreground">
                                {searchTerm ? 'Try a different search term' : 'Create your first email template to get started'}
                            </p>
                            {!searchTerm && (
                                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Template
                                </Button>
                            )}
                        </div>
                    ) : (
                        <ScrollArea className="h-[600px] pr-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredTemplates.map((template) => (
                                    <Card key={template.id} className="group transition-all hover:shadow-md hover:border-primary/50">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-lg">{template.title}</CardTitle>
                                                </div>
                                                <Badge variant="secondary" className="ml-2">
                                                    <Mail className="mr-1 h-3 w-3" />
                                                    Email
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="mb-4">
                                                <p className="line-clamp-3 text-sm text-muted-foreground">
                                                    {template.content}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => handleCopy(template.content, template.id)}
                                                >
                                                    {copiedId === template.id ? (
                                                        <>
                                                            <Check className="mr-2 h-3 w-3" />
                                                            Copied
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="mr-2 h-3 w-3" />
                                                            Copy
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditingTemplate(template)}
                                                >
                                                    <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDelete(template.id, template.title)}
                                                    disabled={deleteTemplate.isPending}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>

            <CreateEmailTemplateDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />

            {editingTemplate && (
                <EditEmailTemplateDialog
                    template={editingTemplate}
                    open={!!editingTemplate}
                    onOpenChange={(open) => !open && setEditingTemplate(null)}
                />
            )}
        </div>
    );
}
