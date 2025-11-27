import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { useUpdateClient } from '@/hooks/useQueries';
import type { Client } from '@/backend';

interface EditClientDialogProps {
    client: Client;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditClientDialog({ client, open, onOpenChange }: EditClientDialogProps) {
    const [firstName, setFirstName] = useState(client.firstName);
    const [lastName, setLastName] = useState(client.lastName);
    const [phoneNumber, setPhoneNumber] = useState(client.phoneNumber);
    const [email, setEmail] = useState(client.email);
    const [address, setAddress] = useState(client.address);

    const updateClient = useUpdateClient();

    useEffect(() => {
        if (open) {
            setFirstName(client.firstName);
            setLastName(client.lastName);
            setPhoneNumber(client.phoneNumber);
            setEmail(client.email);
            setAddress(client.address);
        }
    }, [open, client.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Prevent duplicate submissions
        if (updateClient.isPending) {
            return;
        }

        if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
            toast.error('Please fill in first name, last name, and phone number');
            return;
        }

        try {
            await updateClient.mutateAsync({
                id: client.id,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phoneNumber: phoneNumber.trim(),
                email: email.trim(),
                address: address.trim()
            });
            toast.success('Client updated successfully');
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to update client');
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Client</DialogTitle>
                        <DialogDescription>
                            Update client information
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-firstName">First Name *</Label>
                                <Input
                                    id="edit-firstName"
                                    placeholder="Enter first name"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    disabled={updateClient.isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-lastName">Last Name *</Label>
                                <Input
                                    id="edit-lastName"
                                    placeholder="Enter last name"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    disabled={updateClient.isPending}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-phoneNumber">Phone Number *</Label>
                            <Input
                                id="edit-phoneNumber"
                                placeholder="Phone number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                disabled={updateClient.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                placeholder="client@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={updateClient.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-address">Address</Label>
                            <Input
                                id="edit-address"
                                placeholder="Street address, city, state, zip"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={updateClient.isPending}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateClient.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateClient.isPending}>
                            {updateClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {updateClient.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
