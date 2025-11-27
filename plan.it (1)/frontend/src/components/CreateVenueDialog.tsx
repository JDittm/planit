import { useState } from 'react';
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
import { useAddVenue, useGetAllVenueServices, useAssignServiceToVenue } from '@/hooks/useQueries';
import AddressAutocomplete from './AddressAutocomplete';

interface CreateVenueDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function CreateVenueDialog({ open, onOpenChange }: CreateVenueDialogProps) {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedServices, setSelectedServices] = useState<string[]>([]);

    const addVenue = useAddVenue();
    const { data: allServices = [] } = useGetAllVenueServices();
    const assignService = useAssignServiceToVenue();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !address.trim() || !phone.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        const id = `venue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            await addVenue.mutateAsync({
                id,
                name: name.trim(),
                address: address.trim(),
                phone: phone.trim(),
                hasBar: false,
                barCover: '',
                hasIceMachine: false,
                needsFoodRunner: false
            });

            // Assign selected services to the venue
            if (selectedServices.length > 0) {
                for (const serviceId of selectedServices) {
                    try {
                        await assignService.mutateAsync({ venueId: id, serviceId });
                    } catch (error) {
                        console.error('Failed to assign service:', error);
                    }
                }
            }

            toast.success('Venue added successfully');
            setName('');
            setAddress('');
            setPhone('');
            setSelectedServices([]);
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to add venue');
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
                        <DialogTitle>Add New Venue</DialogTitle>
                        <DialogDescription>
                            Add a new venue to your directory
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="venue-name">Venue Name *</Label>
                            <Input
                                id="venue-name"
                                placeholder="e.g., Grand Ballroom"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={addVenue.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="venue-address">Address *</Label>
                            <AddressAutocomplete
                                id="venue-address"
                                value={address}
                                onChange={setAddress}
                                placeholder="Start typing address..."
                                disabled={addVenue.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="venue-phone">Phone Number *</Label>
                            <Input
                                id="venue-phone"
                                placeholder="(555) 123-4567"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={addVenue.isPending}
                            />
                        </div>

                        {allServices.length > 0 && (
                            <div className="space-y-2">
                                <Label>Services (Optional)</Label>
                                <div className="space-y-2 rounded-md border p-3">
                                    {allServices.map((service) => (
                                        <div key={service.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`service-${service.id}`}
                                                checked={selectedServices.includes(service.id)}
                                                onCheckedChange={() => toggleService(service.id)}
                                                disabled={addVenue.isPending}
                                            />
                                            <label
                                                htmlFor={`service-${service.id}`}
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
                            disabled={addVenue.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={addVenue.isPending}>
                            {addVenue.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Venue
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
