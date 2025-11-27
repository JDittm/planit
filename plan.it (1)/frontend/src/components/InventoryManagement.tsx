import { useState } from 'react';
import { Package, Plus, Loader2, Trash2, Edit, DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
    useGetAllInventoryItems,
    useAddInventoryItem,
    useUpdateInventoryItem,
    useDeleteInventoryItem,
    useGetInventorySummary,
    useCalculateTotalInventoryCost
} from '@/hooks/useQueries';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { InventoryItem } from '@/backend';

export default function InventoryManagement() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

    const [name, setName] = useState('');
    const [details, setDetails] = useState('');
    const [cost, setCost] = useState('');
    const [quantity, setQuantity] = useState('');
    const [category, setCategory] = useState('');

    const { data: inventoryItems = [], isLoading } = useGetAllInventoryItems();
    const { data: summary = [] } = useGetInventorySummary();
    const { data: totalCost = 0 } = useCalculateTotalInventoryCost();
    const addItem = useAddInventoryItem();
    const updateItem = useUpdateInventoryItem();
    const deleteItem = useDeleteInventoryItem();

    const resetForm = () => {
        setName('');
        setDetails('');
        setCost('');
        setQuantity('');
        setCategory('');
    };

    const handleOpenCreateDialog = () => {
        resetForm();
        setIsCreateDialogOpen(true);
    };

    const handleOpenEditDialog = (item: InventoryItem) => {
        setEditingItem(item);
        setName(item.name);
        setDetails(item.details);
        setCost(item.cost.toString());
        setQuantity(item.quantity.toString());
        setCategory(item.category);
        setIsEditDialogOpen(true);
    };

    const handleCreateItem = async () => {
        if (!name.trim()) {
            toast.error('Please enter an item name');
            return;
        }

        if (!category.trim()) {
            toast.error('Please enter a category');
            return;
        }

        const costNum = parseFloat(cost) || 0;
        const quantityNum = parseInt(quantity) || 1;

        if (quantityNum < 1) {
            toast.error('Quantity must be at least 1');
            return;
        }

        const id = `inventory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            await addItem.mutateAsync({
                id,
                name: name.trim(),
                details: details.trim(),
                cost: costNum,
                quantity: BigInt(quantityNum),
                category: category.trim()
            });
            toast.success('Inventory item added successfully');
            setIsCreateDialogOpen(false);
            resetForm();
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to add inventory item';
            toast.error(errorMessage);
            console.error('Inventory item creation error:', error);
        }
    };

    const handleUpdateItem = async () => {
        if (!editingItem) return;

        if (!name.trim()) {
            toast.error('Please enter an item name');
            return;
        }

        if (!category.trim()) {
            toast.error('Please enter a category');
            return;
        }

        const costNum = parseFloat(cost) || 0;
        const quantityNum = parseInt(quantity) || 1;

        if (quantityNum < 1) {
            toast.error('Quantity must be at least 1');
            return;
        }

        try {
            await updateItem.mutateAsync({
                id: editingItem.id,
                name: name.trim(),
                details: details.trim(),
                cost: costNum,
                quantity: BigInt(quantityNum),
                category: category.trim()
            });
            toast.success('Inventory item updated successfully');
            setIsEditDialogOpen(false);
            setEditingItem(null);
            resetForm();
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to update inventory item';
            toast.error(errorMessage);
            console.error('Inventory item update error:', error);
        }
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;

        try {
            await deleteItem.mutateAsync(itemToDelete);
            toast.success('Inventory item deleted successfully');
            setItemToDelete(null);
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to delete inventory item';
            toast.error(errorMessage);
            console.error('Inventory item deletion error:', error);
        }
    };

    const toggleCategory = (categoryName: string) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    const groupedItems = inventoryItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, InventoryItem[]>);

    // Initialize all categories as collapsed
    const allCategories = Object.keys(groupedItems);
    allCategories.forEach(cat => {
        if (collapsedCategories[cat] === undefined) {
            collapsedCategories[cat] = true;
        }
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        <CardTitle>Inventory Management</CardTitle>
                    </div>
                    <CardDescription>Loading inventory items...</CardDescription>
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
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                <CardTitle>Inventory Management</CardTitle>
                            </div>
                            <Button onClick={handleOpenCreateDialog}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Item
                            </Button>
                        </div>
                        <CardDescription>
                            Manage inventory items with costs for event planning and budgeting
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardDescription>Total Items</CardDescription>
                                    <CardTitle className="text-3xl">{inventoryItems.length}</CardTitle>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardDescription>Categories</CardDescription>
                                    <CardTitle className="text-3xl">{Object.keys(groupedItems).length}</CardTitle>
                                </CardHeader>
                            </Card>
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardDescription>Total Value</CardDescription>
                                    <CardTitle className="text-3xl flex items-center">
                                        <DollarSign className="h-6 w-6 mr-1" />
                                        {totalCost.toFixed(2)}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        </div>

                        {/* Inventory Table with Collapsible Categories */}
                        {inventoryItems.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">No Inventory Items</p>
                                <p className="text-sm">
                                    Add your first inventory item to start tracking costs for events.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(groupedItems).map(([categoryName, items]) => {
                                    const isCollapsed = collapsedCategories[categoryName] !== false;
                                    
                                    return (
                                        <Collapsible
                                            key={categoryName}
                                            open={!isCollapsed}
                                            onOpenChange={() => toggleCategory(categoryName)}
                                        >
                                            <div className="border rounded-lg">
                                                <CollapsibleTrigger asChild>
                                                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/5 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            {isCollapsed ? (
                                                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                            ) : (
                                                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                            )}
                                                            <h3 className="text-lg font-semibold">{categoryName}</h3>
                                                            <Badge variant="secondary">{items.length} items</Badge>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Total: ${items.reduce((sum, item) => sum + (item.cost * Number(item.quantity)), 0).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <div className="border-t">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Name</TableHead>
                                                                    <TableHead className="hidden sm:table-cell">Details</TableHead>
                                                                    <TableHead className="text-right">Cost</TableHead>
                                                                    <TableHead className="text-right">Qty</TableHead>
                                                                    <TableHead className="text-right">Total</TableHead>
                                                                    <TableHead className="text-right">Actions</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {items.map((item) => (
                                                                    <TableRow key={item.id}>
                                                                        <TableCell className="font-medium">{item.name}</TableCell>
                                                                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                                                                            {item.details || '-'}
                                                                        </TableCell>
                                                                        <TableCell className="text-right">${item.cost.toFixed(2)}</TableCell>
                                                                        <TableCell className="text-right">{item.quantity.toString()}</TableCell>
                                                                        <TableCell className="text-right font-medium">
                                                                            ${(item.cost * Number(item.quantity)).toFixed(2)}
                                                                        </TableCell>
                                                                        <TableCell className="text-right">
                                                                            <div className="flex items-center justify-end gap-2">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => handleOpenEditDialog(item)}
                                                                                >
                                                                                    <Edit className="h-4 w-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="sm"
                                                                                    onClick={() => setItemToDelete(item.id)}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                                </Button>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </CollapsibleContent>
                                            </div>
                                        </Collapsible>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Inventory Item</DialogTitle>
                        <DialogDescription>
                            Add a new item to your inventory with cost and quantity details
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-name">Item Name *</Label>
                            <Input
                                id="create-name"
                                placeholder="e.g., Folding Chair"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={addItem.isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-category">Category *</Label>
                            <Input
                                id="create-category"
                                placeholder="e.g., Furniture, Linens, Equipment"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                disabled={addItem.isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-details">Details (Optional)</Label>
                            <Textarea
                                id="create-details"
                                placeholder="Additional information about this item..."
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                disabled={addItem.isPending}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="create-cost">Cost per Unit</Label>
                                <Input
                                    id="create-cost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    disabled={addItem.isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create-quantity">Quantity</Label>
                                <Input
                                    id="create-quantity"
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    disabled={addItem.isPending}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateDialogOpen(false)}
                            disabled={addItem.isPending}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreateItem} disabled={addItem.isPending}>
                            {addItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Item
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Inventory Item</DialogTitle>
                        <DialogDescription>
                            Update item details, cost, and quantity
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Item Name *</Label>
                            <Input
                                id="edit-name"
                                placeholder="e.g., Folding Chair"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={updateItem.isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-category">Category *</Label>
                            <Input
                                id="edit-category"
                                placeholder="e.g., Furniture, Linens, Equipment"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                disabled={updateItem.isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-details">Details (Optional)</Label>
                            <Textarea
                                id="edit-details"
                                placeholder="Additional information about this item..."
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                disabled={updateItem.isPending}
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-cost">Cost per Unit</Label>
                                <Input
                                    id="edit-cost"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    disabled={updateItem.isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-quantity">Quantity</Label>
                                <Input
                                    id="edit-quantity"
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    disabled={updateItem.isPending}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsEditDialogOpen(false);
                                setEditingItem(null);
                                resetForm();
                            }}
                            disabled={updateItem.isPending}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateItem} disabled={updateItem.isPending}>
                            {updateItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Item
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this inventory item? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteItem.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteItem}
                            disabled={deleteItem.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteItem.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
