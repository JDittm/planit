import { useState } from 'react';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    useGetAllMenuCategories,
    useAddMenuCategory,
    useDeleteMenuCategory
} from '@/hooks/useQueries';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function MenuManagement() {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

    const { data: menuCategories = [], isLoading } = useGetAllMenuCategories();
    const addCategory = useAddMenuCategory();
    const deleteCategory = useDeleteMenuCategory();

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }

        const id = `menu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            await addCategory.mutateAsync({
                id,
                name: newCategoryName.trim()
            });
            toast.success('Menu category added successfully');
            setNewCategoryName('');
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to add menu category';
            toast.error(errorMessage);
            console.error('Menu category creation error:', error);
        }
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;

        try {
            await deleteCategory.mutateAsync(categoryToDelete);
            toast.success('Menu category deleted successfully');
            setCategoryToDelete(null);
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to delete menu category';
            toast.error(errorMessage);
            console.error('Menu category deletion error:', error);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Menu Management</CardTitle>
                    <CardDescription>Loading menu categories...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Menu Management</CardTitle>
                    <CardDescription>
                        Manage menu categories for events. All listed categories are automatically available during event creation.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Label htmlFor="new-category">Add New Menu Category</Label>
                        <div className="flex gap-2">
                            <Input
                                id="new-category"
                                placeholder="e.g., Breakfast Items"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCategory();
                                    }
                                }}
                                disabled={addCategory.isPending}
                            />
                            <Button
                                onClick={handleAddCategory}
                                disabled={addCategory.isPending || !newCategoryName.trim()}
                            >
                                {addCategory.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Current Menu Categories</Label>
                        {menuCategories.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">
                                No custom menu categories yet. Add categories above to get started.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {menuCategories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-center justify-between rounded-lg border p-4 bg-card hover:bg-accent/5 transition-colors"
                                    >
                                        <span className="font-medium">{category.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCategoryToDelete(category.id)}
                                            disabled={deleteCategory.isPending}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                        <h4 className="font-semibold text-sm">Note</h4>
                        <p className="text-xs text-muted-foreground">
                            All menu categories listed here are automatically available when creating or editing events. 
                            To remove a category from event creation, delete it from this list.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Menu Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this menu category? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteCategory.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteCategory}
                            disabled={deleteCategory.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteCategory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
