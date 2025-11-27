import { useState } from 'react';
import { Plus, Loader2, Trash2, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useGetAllAddOns, useGetAllStaffingRules } from '@/hooks/useQueries';
import { useCreateStaffingRule, useDeleteStaffingRule } from '@/hooks/useQueries';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const STORAGE_KEY = 'staff-positions';

const getStoredPositions = (): string[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : ['Team Lead', 'Kitchen', 'Bar Tender', 'Server', 'Food Runner', 'Busser'];
    } catch {
        return ['Team Lead', 'Kitchen', 'Bar Tender', 'Server', 'Food Runner', 'Busser'];
    }
};

interface PositionRequirement {
    position: string;
    count: number;
}

interface ExtraCondition {
    condition: string;
    position: string;
    count: number;
}

export default function StaffingRulesManagement() {
    const [newRule, setNewRule] = useState({ minGuests: '', maxGuests: '' });
    const [newRulePositions, setNewRulePositions] = useState<PositionRequirement[]>([]);
    const [newRuleExtraConditions, setNewRuleExtraConditions] = useState<ExtraCondition[]>([]);
    const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

    const availablePositions = getStoredPositions();
    const { data: addOns = [] } = useGetAllAddOns();
    const { data: rules = [], isLoading } = useGetAllStaffingRules();
    const createStaffingRule = useCreateStaffingRule();
    const deleteStaffingRule = useDeleteStaffingRule();

    const isMutating = createStaffingRule.isPending || deleteStaffingRule.isPending;

    // Build condition options from add-ons
    const conditionOptions = addOns.map(addOn => ({
        value: addOn.id,
        label: addOn.name
    }));

    const handleAddPositionToNewRule = () => {
        setNewRulePositions([...newRulePositions, { position: availablePositions[0] || 'Server', count: 1 }]);
    };

    const handleUpdateNewRulePosition = (index: number, field: 'position' | 'count', value: string | number) => {
        const updated = [...newRulePositions];
        if (field === 'position') {
            updated[index].position = value as string;
        } else {
            const numValue = typeof value === 'string' ? value : value.toString();
            updated[index].count = numValue === '' ? 0 : parseInt(numValue) || 0;
        }
        setNewRulePositions(updated);
    };

    const handleRemovePositionFromNewRule = (index: number) => {
        setNewRulePositions(newRulePositions.filter((_, idx) => idx !== index));
    };

    const handleAddExtraCondition = () => {
        const defaultCondition = conditionOptions.length > 0 ? conditionOptions[0].value : 'bar_included';
        setNewRuleExtraConditions([
            ...newRuleExtraConditions, 
            { condition: defaultCondition, position: availablePositions[0] || 'Bar Tender', count: 1 }
        ]);
    };

    const handleUpdateExtraCondition = (index: number, field: 'condition' | 'position' | 'count', value: string | number) => {
        const updated = [...newRuleExtraConditions];
        if (field === 'condition') {
            updated[index].condition = value as string;
        } else if (field === 'position') {
            updated[index].position = value as string;
        } else {
            const numValue = typeof value === 'string' ? value : value.toString();
            updated[index].count = numValue === '' ? 0 : parseInt(numValue) || 0;
        }
        setNewRuleExtraConditions(updated);
    };

    const handleRemoveExtraCondition = (index: number) => {
        setNewRuleExtraConditions(newRuleExtraConditions.filter((_, idx) => idx !== index));
    };

    const handleAddRule = async () => {
        const min = parseInt(newRule.minGuests);
        const max = parseInt(newRule.maxGuests);

        if (!min || !max) {
            toast.error('Please fill in guest count range');
            return;
        }

        if (min < 1 || max < 1) {
            toast.error('All values must be greater than 0');
            return;
        }

        if (min > max) {
            toast.error('Minimum guests cannot be greater than maximum guests');
            return;
        }

        if (newRulePositions.length === 0) {
            toast.error('Please add at least one staff position requirement');
            return;
        }

        // Validate all position counts are greater than 0
        const hasInvalidCount = newRulePositions.some(p => p.count < 1);
        if (hasInvalidCount) {
            toast.error('All position counts must be at least 1');
            return;
        }

        const hasOverlap = rules.some(rule => {
            const ruleMin = Number(rule.minGuests);
            const ruleMax = Number(rule.maxGuests);
            return (min >= ruleMin && min <= ruleMax) ||
                   (max >= ruleMin && max <= ruleMax) ||
                   (min <= ruleMin && max >= ruleMax);
        });

        if (hasOverlap) {
            toast.error('This range overlaps with an existing rule');
            return;
        }

        const id = `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            await createStaffingRule.mutateAsync({
                id,
                minGuests: BigInt(min),
                maxGuests: BigInt(max),
                requiredPositions: newRulePositions.map(p => ({ position: p.position, count: BigInt(p.count) })),
                optionalPositions: [],
                extraConditions: newRuleExtraConditions.map(c => ({ 
                    condition: c.condition, 
                    position: c.position, 
                    count: BigInt(c.count),
                    description: ''
                }))
            });

            toast.success('Staffing rule added successfully');
            setNewRule({ minGuests: '', maxGuests: '' });
            setNewRulePositions([]);
            setNewRuleExtraConditions([]);
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to create staffing rule';
            toast.error(errorMessage);
            console.error('Staffing rule creation error:', error);
        }
    };

    const handleDeleteRule = async () => {
        if (!ruleToDelete) return;

        try {
            await deleteStaffingRule.mutateAsync(ruleToDelete);
            toast.success('Staffing rule deleted successfully');
            setRuleToDelete(null);
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to delete staffing rule';
            toast.error(errorMessage);
            console.error('Staffing rule deletion error:', error);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Staffing Rules</CardTitle>
                    <CardDescription>Loading staffing rules...</CardDescription>
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
                    <CardTitle>Staffing Rules</CardTitle>
                    <CardDescription>
                        Define staff requirements based on guest count ranges with optional extra conditions. These rules automatically calculate required staff positions when creating or editing events.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Add New Rule */}
                    <div className="space-y-3 rounded-lg border p-4">
                        <Label className="text-base font-semibold">Add New Rule</Label>
                        
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="min-guests" className="text-sm">Min Guests</Label>
                                <Input
                                    id="min-guests"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="e.g., 1"
                                    value={newRule.minGuests}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || /^\d+$/.test(value)) {
                                            setNewRule({ ...newRule, minGuests: value });
                                        }
                                    }}
                                    disabled={isMutating}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="max-guests" className="text-sm">Max Guests</Label>
                                <Input
                                    id="max-guests"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="e.g., 50"
                                    value={newRule.maxGuests}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || /^\d+$/.test(value)) {
                                            setNewRule({ ...newRule, maxGuests: value });
                                        }
                                    }}
                                    disabled={isMutating}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Required Staff Positions</Label>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={handleAddPositionToNewRule}
                                    disabled={isMutating}
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Position
                                </Button>
                            </div>
                            {newRulePositions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No positions added yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {newRulePositions.map((pos, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <Select
                                                value={pos.position}
                                                onValueChange={(value) => handleUpdateNewRulePosition(idx, 'position', value)}
                                                disabled={isMutating}
                                            >
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availablePositions.map(p => (
                                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                type="text"
                                                inputMode="numeric"
                                                value={pos.count === 0 ? '' : pos.count.toString()}
                                                onChange={(e) => handleUpdateNewRulePosition(idx, 'count', e.target.value)}
                                                placeholder="1"
                                                className="w-20"
                                                disabled={isMutating}
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleRemovePositionFromNewRule(idx)}
                                                disabled={isMutating}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {conditionOptions.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold">Extra Conditions (Optional)</Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handleAddExtraCondition}
                                        disabled={isMutating}
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Condition
                                    </Button>
                                </div>
                                {newRuleExtraConditions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No extra conditions added</p>
                                ) : (
                                    <div className="space-y-2">
                                        {newRuleExtraConditions.map((cond, idx) => (
                                            <div key={idx} className="rounded-lg border p-3 bg-card">
                                                <div className="space-y-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 space-y-2">
                                                            <div className="space-y-1">
                                                                <Label className="text-xs text-muted-foreground">When add-on is selected</Label>
                                                                <Select
                                                                    value={cond.condition}
                                                                    onValueChange={(value) => handleUpdateExtraCondition(idx, 'condition', value)}
                                                                    disabled={isMutating}
                                                                >
                                                                    <SelectTrigger className="w-full">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {conditionOptions.map(opt => (
                                                                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="grid grid-cols-[1fr_80px] gap-2">
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs text-muted-foreground">Position</Label>
                                                                    <Select
                                                                        value={cond.position}
                                                                        onValueChange={(value) => handleUpdateExtraCondition(idx, 'position', value)}
                                                                        disabled={isMutating}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {availablePositions.map(p => (
                                                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs text-muted-foreground">Count</Label>
                                                                    <Input
                                                                        type="text"
                                                                        inputMode="numeric"
                                                                        value={cond.count === 0 ? '' : cond.count.toString()}
                                                                        onChange={(e) => handleUpdateExtraCondition(idx, 'count', e.target.value)}
                                                                        placeholder="1"
                                                                        className="w-full"
                                                                        disabled={isMutating}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleRemoveExtraCondition(idx)}
                                                            className="flex-shrink-0"
                                                            disabled={isMutating}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <Button
                            onClick={handleAddRule}
                            disabled={isMutating || !newRule.minGuests || !newRule.maxGuests || newRulePositions.length === 0}
                            className="w-full"
                        >
                            {createStaffingRule.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {!createStaffingRule.isPending && <Plus className="mr-2 h-4 w-4" />}
                            Add Rule
                        </Button>
                    </div>

                    {/* Current Rules */}
                    <div className="space-y-3">
                        <Label className="text-base font-semibold">Current Rules</Label>
                        {rules.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4">
                                No staffing rules defined yet. Add your first rule above.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {rules.map((rule) => (
                                    <div
                                        key={rule.id}
                                        className="rounded-lg border p-4 bg-card space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">
                                                    {rule.minGuests.toString()} - {rule.maxGuests.toString()} guests
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setRuleToDelete(rule.id)}
                                                disabled={isMutating}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                        
                                        <div className="space-y-2 pl-6">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Required positions:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {rule.requiredPositions.map((pos, idx) => (
                                                        <Badge key={idx} variant="default">
                                                            {pos.count.toString()}x {pos.position}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {rule.extraConditions.length > 0 && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Extra conditions:</p>
                                                    <div className="space-y-1">
                                                        {rule.extraConditions.map((cond, idx) => {
                                                            const addOn = addOns.find(a => a.id === cond.condition);
                                                            const condLabel = addOn ? addOn.name : cond.condition;
                                                            return (
                                                                <div key={idx} className="text-xs flex flex-wrap items-center gap-2">
                                                                    <span className="text-muted-foreground">If {condLabel}:</span>
                                                                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                                                        +{cond.count.toString()}x {cond.position}
                                                                    </Badge>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={!!ruleToDelete} onOpenChange={(open) => !open && setRuleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Staffing Rule</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this staffing rule? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteStaffingRule.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteRule}
                            disabled={deleteStaffingRule.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteStaffingRule.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
