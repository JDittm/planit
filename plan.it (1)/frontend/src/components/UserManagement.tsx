import { useState } from 'react';
import { Plus, Loader2, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
    useGetAllMenuCategories,
    useAddMenuCategory,
    useDeleteMenuCategory,
    useAddSubcategoryToMenuCategory,
    useRemoveSubcategoryFromMenuCategory
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

const STORAGE_KEY = 'staff-positions';

const getStoredPositions = (): string[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : ['Team Lead', 'Kitchen', 'Bar Tender', 'Server', 'Food Runner', 'Busser'];
    } catch {
        return ['Team Lead', 'Kitchen', 'Bar Tender', 'Server', 'Food Runner', 'Busser'];
    }
};

const savePositions = (positions: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
};

export default function UserManagement() {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState<string | null>(null);
    const [newSubcategoryName, setNewSubcategoryName] = useState('');

    const [staffPositions, setStaffPositions] = useState<string[]>(getStoredPositions());
    const [newPositionName, setNewPositionName] = useState('');
    const [positionToDelete, setPositionToDelete] = useState<string | null>(null);

    const { data: menuCategories = [], isLoading: menuLoading } = useGetAllMenuCategories();
    const addCategory = useAddMenuCategory();
    const deleteCategory = useDeleteMenuCategory();
    const addSubcategory = useAddSubcategoryToMenuCategory();
    const removeSubcategory = useRemoveSubcategoryFromMenuCategory();

    const isMutating = addCategory.isPending || deleteCategory.isPending || 
                       addSubcategory.isPending || removeSubcategory.isPending;

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

    const handleAddSubcategory = async (categoryId: string) => {
        if (!newSubcategoryName.trim()) {
            toast.error('Please enter a subcategory name');
            return;
        }

        try {
            await addSubcategory.mutateAsync({
                categoryId,
                subcategory: newSubcategoryName.trim()
            });
            toast.success('Subcategory added successfully');
            setNewSubcategoryName('');
            setSelectedCategoryForSubcategory(null);
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to add subcategory';
            toast.error(errorMessage);
            console.error('Subcategory creation error:', error);
        }
    };

    const handleRemoveSubcategory = async (categoryId: string, subcategory: string) => {
        try {
            await removeSubcategory.mutateAsync({
                categoryId,
                subcategory
            });
            toast.success('Subcategory removed successfully');
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to remove subcategory';
            toast.error(errorMessage);
            console.error('Subcategory removal error:', error);
        }
    };

    const handleAddPosition = () => {
        if (!newPositionName.trim()) {
            toast.error('Please enter a position name');
            return;
        }

        if (staffPositions.includes(newPositionName.trim())) {
            toast.error('This position already exists');
            return;
        }

        const updatedPositions = [...staffPositions, newPositionName.trim()];
        setStaffPositions(updatedPositions);
        savePositions(updatedPositions);
        toast.success('Staff position added successfully');
        setNewPositionName('');
    };

    const handleDeletePosition = () => {
        if (!positionToDelete) return;

        const updatedPositions = staffPositions.filter(p => p !== positionToDelete);
        setStaffPositions(updatedPositions);
        savePositions(updatedPositions);
        toast.success('Staff position deleted successfully');
        setPositionToDelete(null);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Management Settings</CardTitle>
                <CardDescription>
                    Manage menu items and staff positions for your events
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="menu" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="menu">Menu Items</TabsTrigger>
                        <TabsTrigger value="positions">Staff Positions</TabsTrigger>
                    </TabsList>

                    <TabsContent value="menu" className="space-y-6 mt-6">
                        {menuLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <>
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
                                            disabled={isMutating}
                                        />
                                        <Button
                                            onClick={handleAddCategory}
                                            disabled={isMutating || !newCategoryName.trim()}
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
                                    <Label>Menu Categories</Label>
                                    {menuCategories.length === 0 ? (
                                        <p className="text-sm text-muted-foreground py-4">
                                            No custom menu categories yet. Add categories above to get started.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {menuCategories.map((category) => (
                                                <div
                                                    key={category.id}
                                                    className="rounded-lg border p-3 bg-card space-y-2"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-sm">{category.name}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setCategoryToDelete(category.id)}
                                                            disabled={isMutating}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                        </Button>
                                                    </div>

                                                    {category.subcategories.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5 pl-2">
                                                            {category.subcategories.map((subcat, idx) => (
                                                                <Badge key={idx} variant="secondary" className="text-xs h-6 gap-1 px-2">
                                                                    {subcat}
                                                                    <button
                                                                        onClick={() => handleRemoveSubcategory(category.id, subcat)}
                                                                        disabled={isMutating}
                                                                        className="ml-0.5 hover:text-destructive"
                                                                    >
                                                                        <X className="h-2.5 w-2.5" />
                                                                    </button>
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {selectedCategoryForSubcategory === category.id ? (
                                                        <div className="flex gap-1.5 pl-2">
                                                            <Input
                                                                placeholder="Subcategory"
                                                                value={newSubcategoryName}
                                                                onChange={(e) => setNewSubcategoryName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handleAddSubcategory(category.id);
                                                                    }
                                                                    if (e.key === 'Escape') {
                                                                        setSelectedCategoryForSubcategory(null);
                                                                        setNewSubcategoryName('');
                                                                    }
                                                                }}
                                                                disabled={isMutating}
                                                                autoFocus
                                                                className="h-7 text-xs"
                                                            />
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleAddSubcategory(category.id)}
                                                                disabled={isMutating || !newSubcategoryName.trim()}
                                                                className="h-7 px-2 text-xs"
                                                            >
                                                                {addSubcategory.isPending ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                ) : (
                                                                    'Add'
                                                                )}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setSelectedCategoryForSubcategory(null);
                                                                    setNewSubcategoryName('');
                                                                }}
                                                                disabled={isMutating}
                                                                className="h-7 px-2 text-xs"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setSelectedCategoryForSubcategory(category.id)}
                                                            disabled={isMutating}
                                                            className="h-7 text-xs pl-2"
                                                        >
                                                            <Plus className="mr-1 h-3 w-3" />
                                                            Add Subcategory
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="positions" className="space-y-6 mt-6">
                        <div className="space-y-3">
                            <Label htmlFor="new-position">Add New Staff Position</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="new-position"
                                    placeholder="e.g., Event Coordinator"
                                    value={newPositionName}
                                    onChange={(e) => setNewPositionName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddPosition();
                                        }
                                    }}
                                />
                                <Button
                                    onClick={handleAddPosition}
                                    disabled={!newPositionName.trim()}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Current Staff Positions</Label>
                            <div className="space-y-1.5">
                                {staffPositions.map((position) => (
                                    <div
                                        key={position}
                                        className="flex items-center justify-between rounded-lg border p-2.5 bg-card hover:bg-accent/5 transition-colors"
                                    >
                                        <span className="text-sm font-medium">{position}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setPositionToDelete(position)}
                                            className="h-7 w-7 p-0"
                                        >
                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                            <h4 className="font-semibold text-xs">Note</h4>
                            <p className="text-xs text-muted-foreground">
                                These positions will be available when creating or editing staff members. 
                                Changes are saved locally and will persist across sessions.
                            </p>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>

            <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Menu Category</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this menu category? This will also remove all its subcategories. This action cannot be undone.
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

            <AlertDialog open={!!positionToDelete} onOpenChange={(open) => !open && setPositionToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Staff Position</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this staff position? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePosition}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
