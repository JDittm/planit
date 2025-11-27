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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useUpdateVenue, useGetAllVenueServices, useAssignServiceToVenue, useRemoveServiceFromVenue } from '@/hooks/useQueries';
import AddressAutocomplete from './AddressAutocomplete';
import type { Venue } from '@/backend';

interface EditVenueDialogProps {
    venue: Venue;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function EditVenueDialog({ venue, open, onOpenChange }: EditVenueDialogProps) {
    const [name, setName] = useState(venue.name);
    const [address, setAddress] = useState(venue.address);
    const [phone, setPhone] = useState(venue.phone);
    const [selectedServices, setSelectedServices] = useState<string[]>(venue.services);

    const updateVenue = useUpdateVenue();
    const { data: allServices = [] } = useGetAllVenueServices();
    const assignService = useAssignServiceToVenue();
    const removeService = useRemoveServiceFromVenue();

    useEffect(() => {
        if (open) {
            setName(venue.name);
            setAddress(venue.address);
            setPhone(venue.phone);
            setSelectedServices(venue.services);
        }
    }, [open, venue.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (updateVenue.isPending) {
            return;
        }

        if (!name.trim() || !address.trim() || !phone.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            await updateVenue.mutateAsync({
                id: venue.id,
                name: name.trim(),
                address: address.trim(),
                phone: phone.trim(),
                hasBar: venue.hasBar,
                barCover: venue.barCover,
                hasIceMachine: venue.hasIceMachine,
                needsFoodRunner: venue.needsFoodRunner
            });

            // Handle service changes
            const servicesToAdd = selectedServices.filter(s => !venue.services.includes(s));
            const servicesToRemove = venue.services.filter(s => !selectedServices.includes(s));

            for (const serviceId of servicesToAdd) {
                try {
                    await assignService.mutateAsync({ venueId: venue.id, serviceId });
                } catch (error) {
                    console.error('Failed to assign service:', error);
                }
            }

            for (const serviceId of servicesToRemove) {
                try {
                    await removeService.mutateAsync({ venueId: venue.id, serviceId });
                } catch (error) {
                    console.error('Failed to remove service:', error);
                }
            }

            toast.success('Venue updated successfully');
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to update venue');
            console.error(error);
        }
    };

    const toggleService = (serviceId: string) => {
        setSelectedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Venue</DialogTitle>
                        <DialogDescription>
                            Update venue information
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-venue-name">Venue Name *</Label>
                            <Input
                                id="edit-venue-name"
                                placeholder="e.g., Grand Ballroom"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={updateVenue.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-venue-address">Address *</Label>
                            <AddressAutocomplete
                                id="edit-venue-address"
                                value={address}
                                onChange={setAddress}
                                placeholder="Start typing address..."
                                disabled={updateVenue.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-venue-phone">Phone Number *</Label>
                            <Input
                                id="edit-venue-phone"
                                placeholder="(555) 123-4567"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={updateVenue.isPending}
                            />
                        </div>

                        {allServices.length > 0 && (
                            <div className="space-y-2">
                                <Label>Services (Optional)</Label>
                                <div className="space-y-2 rounded-md border p-3">
                                    {allServices.map((service) => (
                                        <div key={service.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`edit-service-${service.id}`}
                                                checked={selectedServices.includes(service.id)}
                                                onCheckedChange={() => toggleService(service.id)}
                                                disabled={updateVenue.isPending}
                                            />
                                            <label
                                                htmlFor={`edit-service-${service.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {service.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={updateVenue.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateVenue.isPending}>
                            {updateVenue.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {updateVenue.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
