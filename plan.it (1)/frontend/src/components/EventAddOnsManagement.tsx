import { useState } from 'react';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
    useGetAllAddOns,
    useCreateAddOn,
    useUpdateAddOn,
    useDeleteAddOn
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

export default function EventAddOnsManagement() {
    const [newAddOnName, setNewAddOnName] = useState('');
    const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
    const [addOnToDelete, setAddOnToDelete] = useState<string | null>(null);
    const [editingAddOn, setEditingAddOn] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editPositions, setEditPositions] = useState<string[]>([]);

    const availablePositions = getStoredPositions();
    const { data: addOns = [], isLoading } = useGetAllAddOns();
    const createAddOn = useCreateAddOn();
    const updateAddOn = useUpdateAddOn();
    const deleteAddOn = useDeleteAddOn();

    const isMutating = createAddOn.isPending || updateAddOn.isPending || deleteAddOn.isPending;

    const handleAddAddOn = async () => {
        if (!newAddOnName.trim()) {
            toast.error('Please enter an add-on name');
            return;
        }

        const id = `addon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            await createAddOn.mutateAsync({
                id,
                name: newAddOnName.trim(),
                associatedPositions: selectedPositions
            });
            toast.success('Event add-on created successfully');
            setNewAddOnName('');
            setSelectedPositions([]);
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to create add-on';
            toast.error(errorMessage);
            console.error('Add-on creation error:', error);
        }
    };

    const handleStartEdit = (addOn: any) => {
        setEditingAddOn(addOn.id);
        setEditName(addOn.name);
        setEditPositions(addOn.associatedPositions);
    };

    const handleSaveEdit = async () => {
        if (!editingAddOn || !editName.trim()) return;

        try {
            await updateAddOn.mutateAsync({
                id: editingAddOn,
                name: editName.trim(),
                associatedPositions: editPositions
            });
            toast.success('Add-on updated successfully');
            setEditingAddOn(null);
            setEditName('');
            setEditPositions([]);
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to update add-on';
            toast.error(errorMessage);
            console.error('Add-on update error:', error);
        }
    };

    const handleDeleteAddOn = async () => {
        if (!addOnToDelete) return;

        try {
            await deleteAddOn.mutateAsync(addOnToDelete);
            toast.success('Event add-on deleted successfully');
            setAddOnToDelete(null);
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to delete add-on';
            toast.error(errorMessage);
            console.error('Add-on deletion error:', error);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Event Add-ons</CardTitle>
                    <CardDescription>Loading event add-ons...</CardDescription>
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
                    <CardTitle>Event Add-ons</CardTitle>
                    <CardDescription>
                        Create optional add-ons for events with associated staff positions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <Label htmlFor="new-addon">Create New Add-on</Label>
                        <Input
                            id="new-addon"
                            placeholder="e.g., Bar Service"
                            value={newAddOnName}
                            onChange={(e) => setNewAddOnName(e.target.value)}
                            disabled={isMutating}
                        />
                        
                        <div className="space-y-2">
                            <Label className="text-sm">Associated Staff Positions (optional)</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {availablePositions.map(position => (
                                    <div key={position} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`pos-${position}`}
                                            checked={selectedPositions.includes(position)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedPositions([...selectedPositions, position]);
                                                } else {
                                                    setSelectedPositions(selectedPositions.filter(p => p !== position));
                                                }
                                            }}
                                            disabled={isMutating}
                                        />
                                        <Label htmlFor={`pos-${position}`} className="text-sm cursor-pointer">
                                            {position}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={handleAddAddOn}
                            disabled={isMutating || !newAddOnName.trim()}
                            className="w-full"
                        >
                            {createAddOn.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="mr-2 h-4 w-4" />
                            )}
                            Create Add-on
                        </Button>
                    </div>

                    <div className="space-y-3">
                        <Label>Current Event Add-ons</Label>
                        {addOns.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">
                                No event add-ons yet. Create your first add-on above.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {addOns.map((addOn) => (
                                    <div
                                        key={addOn.id}
                                        className="rounded-lg border p-4 bg-card space-y-3"
                                    >
                                        {editingAddOn === addOn.id ? (
                                            <>
                                                <Input
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    disabled={isMutating}
                                                />
                                                <div className="space-y-2">
                                                    <Label className="text-sm">Associated Positions</Label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {availablePositions.map(position => (
                                                            <div key={position} className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`edit-pos-${position}`}
                                                                    checked={editPositions.includes(position)}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            setEditPositions([...editPositions, position]);
                                                                        } else {
                                                                            setEditPositions(editPositions.filter(p => p !== position));
                                                                        }
                                                                    }}
                                                                    disabled={isMutating}
                                                                />
                                                                <Label htmlFor={`edit-pos-${position}`} className="text-sm cursor-pointer">
                                                                    {position}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={handleSaveEdit}
                                                        disabled={isMutating}
                                                    >
                                                        {updateAddOn.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                                        Save
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => {
                                                            setEditingAddOn(null);
                                                            setEditName('');
                                                            setEditPositions([]);
                                                        }}
                                                        disabled={isMutating}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-base">{addOn.name}</span>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleStartEdit(addOn)}
                                                            disabled={isMutating}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setAddOnToDelete(addOn.id)}
                                                            disabled={isMutating}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                {addOn.associatedPositions.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="text-sm text-muted-foreground">Positions:</span>
                                                        {addOn.associatedPositions.map((pos, idx) => (
                                                            <Badge key={idx} variant="secondary">{pos}</Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!addOnToDelete} onOpenChange={(open) => !open && setAddOnToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Event Add-on</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this event add-on? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteAddOn.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAddOn}
                            disabled={deleteAddOn.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteAddOn.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
