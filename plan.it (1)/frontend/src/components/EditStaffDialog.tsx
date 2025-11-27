import { useState, useEffect } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useUpdateStaff } from '@/hooks/useQueries';
import type { Staff } from '@/backend';
import { format } from 'date-fns';

interface EditStaffDialogProps {
    staff: Staff;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const STORAGE_KEY = 'staff-positions';

const getStoredPositions = (): string[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : ['Team Lead', 'Kitchen', 'Bar Tender', 'Server'];
    } catch {
        return ['Team Lead', 'Kitchen', 'Bar Tender', 'Server'];
    }
};

export default function EditStaffDialog({ staff, open, onOpenChange }: EditStaffDialogProps) {
    const [firstName, setFirstName] = useState(staff.firstName);
    const [lastName, setLastName] = useState(staff.lastName);
    const [phoneNumber, setPhoneNumber] = useState(staff.phoneNumber);
    const [email, setEmail] = useState(staff.email);
    const [positions, setPositions] = useState<string[]>(staff.positions);
    const [selectedPosition, setSelectedPosition] = useState('');
    const [joinedDate, setJoinedDate] = useState('');
    const [payRate, setPayRate] = useState('');
    const [availablePositions, setAvailablePositions] = useState<string[]>([]);

    const updateStaff = useUpdateStaff();

    useEffect(() => {
        if (open) {
            setFirstName(staff.firstName);
            setLastName(staff.lastName);
            setPhoneNumber(staff.phoneNumber);
            setEmail(staff.email);
            setPositions([...staff.positions]);
            setSelectedPosition('');
            setAvailablePositions(getStoredPositions());
            
            if (staff.joinedDate > 0) {
                const date = new Date(Number(staff.joinedDate) / 1000000);
                setJoinedDate(format(date, 'yyyy-MM-dd'));
            } else {
                setJoinedDate('');
            }

            if (staff.payRate !== undefined && staff.payRate !== null) {
                setPayRate(staff.payRate.toString());
            } else {
                setPayRate('');
            }
        }
    }, [open, staff]);

    const handleAddPosition = () => {
        if (selectedPosition && !positions.includes(selectedPosition)) {
            setPositions([...positions, selectedPosition]);
            setSelectedPosition('');
        }
    };

    const handleRemovePosition = (position: string) => {
        setPositions(positions.filter(p => p !== position));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (updateStaff.isPending) {
            return;
        }

        if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
            toast.error('Please fill in first name, last name, and phone number');
            return;
        }

        let joinedDateNanos = BigInt(0);
        if (joinedDate) {
            const date = new Date(joinedDate);
            joinedDateNanos = BigInt(date.getTime()) * BigInt(1000000);
        }

        let payRateValue: number | null = null;
        if (payRate.trim()) {
            const rate = parseFloat(payRate);
            if (!isNaN(rate) && rate >= 0) {
                payRateValue = rate;
            }
        }

        try {
            await updateStaff.mutateAsync({
                id: staff.id,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phoneNumber: phoneNumber.trim(),
                email: email.trim(),
                positions: [...positions],
                joinedDate: joinedDateNanos,
                payRate: payRateValue
            });
            toast.success('Staff member updated successfully');
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to update staff member');
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Staff Member</DialogTitle>
                        <DialogDescription>
                            Update staff member information
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-staff-firstName">First Name *</Label>
                                <Input
                                    id="edit-staff-firstName"
                                    placeholder="e.g., John"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    disabled={updateStaff.isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-staff-lastName">Last Name *</Label>
                                <Input
                                    id="edit-staff-lastName"
                                    placeholder="e.g., Smith"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    disabled={updateStaff.isPending}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-staff-phone">Phone Number *</Label>
                            <Input
                                id="edit-staff-phone"
                                type="tel"
                                placeholder="e.g., (555) 123-4567"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                disabled={updateStaff.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-staff-email">Email</Label>
                            <Input
                                id="edit-staff-email"
                                type="email"
                                placeholder="e.g., john@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={updateStaff.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-staff-payRate">Pay Rate ($/hour)</Label>
                            <Input
                                id="edit-staff-payRate"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="e.g., 15.00"
                                value={payRate}
                                onChange={(e) => setPayRate(e.target.value)}
                                disabled={updateStaff.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Positions</Label>
                            {positions.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {positions.map((pos) => (
                                        <Badge key={pos} variant="secondary" className="gap-1">
                                            {pos}
                                            <button
                                                type="button"
                                                onClick={() => handleRemovePosition(pos)}
                                                className="ml-1 hover:text-destructive"
                                                disabled={updateStaff.isPending}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Select value={selectedPosition} onValueChange={setSelectedPosition} disabled={updateStaff.isPending}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Select a position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availablePositions
                                            .filter(p => !positions.includes(p))
                                            .map((pos) => (
                                                <SelectItem key={pos} value={pos}>
                                                    {pos}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleAddPosition}
                                    disabled={!selectedPosition || updateStaff.isPending}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Manage available positions in the Profile tab under User Management
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-staff-joined">Joined Date</Label>
                            <Input
                                id="edit-staff-joined"
                                type="date"
                                value={joinedDate}
                                onChange={(e) => setJoinedDate(e.target.value)}
                                disabled={updateStaff.isPending}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateStaff.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateStaff.isPending}>
                            {updateStaff.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {updateStaff.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
