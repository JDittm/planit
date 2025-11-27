import { useState, useEffect, useMemo } from 'react';
import { Loader2, Plus, X, UserPlus, MapPin, Calendar as CalendarIcon } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useCreateEvent, useGetAllVenues, useGetDashboardData, useCreateClient, useAddVenue, useGetAllMenuCategories, useGetAllAddOns, useGetDailyEventLimit, useGetAllVenueServices, useGetAllStaff } from '@/hooks/useQueries';
import { format } from 'date-fns';
import DistanceDisplay from './DistanceDisplay';
import AddressAutocomplete from './AddressAutocomplete';
import TimePicker from './TimePicker';
import type { Client, EventDetail, MenuDetail, MenuItem } from '@/backend';

interface CreateEventDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clients: Client[];
}

const DEFAULT_DETAILS = [
    'Dietary Requirements',
    'Staff Assigned'
];

interface MenuItemState {
    beginTime?: string;
    endTime?: string;
    notes: string;
    subcategoryDetails: string[];
}

export default function CreateEventDialog({ open, onOpenChange, clients }: CreateEventDialogProps) {
    const [name, setName] = useState('');
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [time, setTime] = useState('');
    const [venueId, setVenueId] = useState('');
    const [clientId, setClientId] = useState('');
    const [guestCount, setGuestCount] = useState('');
    const [details, setDetails] = useState<string[]>(DEFAULT_DETAILS);
    const [newDetail, setNewDetail] = useState('');
    const [specialRequests, setSpecialRequests] = useState('');
    const [selectedMenuItems, setSelectedMenuItems] = useState<Record<string, MenuItemState>>({});
    const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
    const [selectedVenueServices, setSelectedVenueServices] = useState<string[]>([]);
    const [downPaymentAmount, setDownPaymentAmount] = useState('');
    const [fullPaymentAmount, setFullPaymentAmount] = useState('');
    const [isDownPaymentMade, setIsDownPaymentMade] = useState(false);
    const [isFullPaymentMade, setIsFullPaymentMade] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [newClientFirstName, setNewClientFirstName] = useState('');
    const [newClientLastName, setNewClientLastName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');
    const [newClientEmail, setNewClientEmail] = useState('');
    const [newClientAddress, setNewClientAddress] = useState('');

    const [showNewVenueForm, setShowNewVenueForm] = useState(false);
    const [newVenueName, setNewVenueName] = useState('');
    const [newVenueAddress, setNewVenueAddress] = useState('');
    const [newVenuePhone, setNewVenuePhone] = useState('');
    const [saveVenueToDatabase, setSaveVenueToDatabase] = useState(false);

    const createEvent = useCreateEvent();
    const createClient = useCreateClient();
    const addVenue = useAddVenue();
    const { data: venues = [] } = useGetAllVenues();
    const { data: dashboardData = [] } = useGetDashboardData();
    const { data: menuCategories = [] } = useGetAllMenuCategories();
    const { data: addOns = [] } = useGetAllAddOns();
    const { data: dailyEventLimit } = useGetDailyEventLimit();
    const { data: allServices = [] } = useGetAllVenueServices();
    const { data: staff = [] } = useGetAllStaff();

    const selectedVenue = venues.find(v => v.id === venueId);

    const getServiceNameById = (serviceId: string): string => {
        const service = allServices.find(s => s.id === serviceId);
        return service ? service.name : serviceId;
    };

    const visibleCategories = useMemo(() => {
        return menuCategories;
    }, [menuCategories]);

    useEffect(() => {
        if (open) {
            setSelectedMenuItems({});
        }
    }, [open]);

    const handleDateSelect = (selectedDate: Date | undefined) => {
        setDate(selectedDate);
        setIsCalendarOpen(false);
    };

    const handleAddDetail = () => {
        if (newDetail.trim() && !details.includes(newDetail.trim())) {
            setDetails([...details, newDetail.trim()]);
            setNewDetail('');
        }
    };

    const handleRemoveDetail = (detail: string) => {
        setDetails(details.filter((d) => d !== detail));
    };

    const handleMenuItemSelect = (categoryId: string) => {
        const category = visibleCategories.find(c => c.id === categoryId);
        if (!category) return;

        setSelectedMenuItems(prev => {
            const newState = { ...prev };
            if (!newState[categoryId]) {
                newState[categoryId] = {
                    beginTime: '',
                    endTime: '',
                    notes: '',
                    subcategoryDetails: category.subcategories.map(() => '')
                };
            }
            return newState;
        });
    };

    const handleRemoveMenuItem = (categoryId: string) => {
        setSelectedMenuItems(prev => {
            const newState = { ...prev };
            delete newState[categoryId];
            return newState;
        });
    };

    const handleMenuItemTimeChange = (categoryId: string, field: 'beginTime' | 'endTime', value: string) => {
        setSelectedMenuItems(prev => ({
            ...prev,
            [categoryId]: { ...prev[categoryId], [field]: value }
        }));
    };

    const handleMenuItemNotesChange = (categoryId: string, value: string) => {
        setSelectedMenuItems(prev => ({
            ...prev,
            [categoryId]: { ...prev[categoryId], notes: value }
        }));
    };

    const handleSubcategoryDetailChange = (categoryId: string, index: number, value: string) => {
        setSelectedMenuItems(prev => {
            const newDetails = [...prev[categoryId].subcategoryDetails];
            newDetails[index] = value;
            return {
                ...prev,
                [categoryId]: { ...prev[categoryId], subcategoryDetails: newDetails }
            };
        });
    };

    const handleCreateNewClient = async () => {
        if (!newClientFirstName.trim() || !newClientLastName.trim() || !newClientPhone.trim()) {
            toast.error('Please fill in first name, last name, and phone number');
            return;
        }

        const id = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            await createClient.mutateAsync({
                id,
                firstName: newClientFirstName.trim(),
                lastName: newClientLastName.trim(),
                phoneNumber: newClientPhone.trim(),
                email: newClientEmail.trim(),
                address: newClientAddress.trim()
            });
            toast.success('Client created successfully');
            setClientId(id);
            setShowNewClientForm(false);
            setNewClientFirstName('');
            setNewClientLastName('');
            setNewClientPhone('');
            setNewClientEmail('');
            setNewClientAddress('');
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to create client';
            toast.error(errorMessage);
            console.error('Client creation error:', error);
        }
    };

    const handleAddVenue = async () => {
        if (!newVenueName.trim() || !newVenueAddress.trim() || !newVenuePhone.trim()) {
            toast.error('Please fill in venue name, address, and phone number');
            return;
        }

        const id = `venue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        if (saveVenueToDatabase) {
            try {
                await addVenue.mutateAsync({
                    id,
                    name: newVenueName.trim(),
                    address: newVenueAddress.trim(),
                    phone: newVenuePhone.trim(),
                    hasBar: false,
                    barCover: '',
                    hasIceMachine: false,
                    needsFoodRunner: false
                });
                toast.success('Venue saved to database');
                setVenueId(id);
                setShowNewVenueForm(false);
                setNewVenueName('');
                setNewVenueAddress('');
                setNewVenuePhone('');
                setSaveVenueToDatabase(false);
            } catch (error: any) {
                const errorMessage = error?.message || 'Failed to save venue';
                toast.error(errorMessage);
                console.error('Venue creation error:', error);
            }
        } else {
            setVenueId(newVenueName.trim());
            toast.success('Venue added to event');
            setShowNewVenueForm(false);
            setNewVenueName('');
            setNewVenueAddress('');
            setNewVenuePhone('');
            setSaveVenueToDatabase(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !date || !time || !venueId || !clientId) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!guestCount || parseInt(guestCount) <= 0) {
            toast.error('Please enter a valid guest count');
            return;
        }

        if (details.length === 0) {
            toast.error('Please add at least one event detail to track');
            return;
        }

        const dateTime = new Date(date);
        const [hours, minutes] = time.split(':');
        dateTime.setHours(parseInt(hours), parseInt(minutes));
        const dateNanos = BigInt(dateTime.getTime()) * BigInt(1000000);
        const dateOnly = format(dateTime, 'yyyy-MM-dd');

        const allEvents = dashboardData.flatMap(([_, events]) => events);
        const eventsOnSameDay = allEvents.filter(e => {
            const eDate = new Date(Number(e.date) / 1000000);
            const eDateOnly = format(eDate, 'yyyy-MM-dd');
            return eDateOnly === dateOnly;
        });

        const limit = dailyEventLimit ? Number(dailyEventLimit) : 3;
        if (eventsOnSameDay.length >= limit) {
            toast.error(`Maximum of ${limit} events per day. This date already has ${eventsOnSameDay.length} events booked.`);
            return;
        }

        const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const eventDetails: EventDetail[] = details.map((detail) => ({
            name: detail,
            isConfirmed: false,
            specificInfo: ''
        }));

        const venueName = selectedVenue ? selectedVenue.name : venueId;

        const menuDetails: MenuDetail[] = [];
        Object.entries(selectedMenuItems).forEach(([categoryId, data]) => {
            const category = visibleCategories.find(c => c.id === categoryId);
            if (!category) return;

            const items: MenuItem[] = [{ 
                name: category.name, 
                details: category.subcategories.length > 0 
                    ? data.subcategoryDetails.filter(d => d.trim() !== '')
                    : []
            }];
            
            let beginServingTime: bigint | undefined;
            let endServingTime: bigint | undefined;
            
            if (data.beginTime) {
                const [bHours, bMinutes] = data.beginTime.split(':');
                const beginDate = new Date(date);
                beginDate.setHours(parseInt(bHours), parseInt(bMinutes));
                beginServingTime = BigInt(beginDate.getTime()) * BigInt(1000000);
            }
            
            if (data.endTime) {
                const [eHours, eMinutes] = data.endTime.split(':');
                const endDate = new Date(date);
                endDate.setHours(parseInt(eHours), parseInt(eMinutes));
                endServingTime = BigInt(endDate.getTime()) * BigInt(1000000);
            }
            
            menuDetails.push({ 
                category: category.name, 
                items,
                beginServingTime,
                endServingTime,
                notes: data.notes
            });
        });

        try {
            await createEvent.mutateAsync({
                id,
                name: name.trim(),
                date: dateNanos,
                venue: venueName,
                clientId,
                guestCount: BigInt(parseInt(guestCount)),
                details: eventDetails,
                staffAssignments: [],
                menuDetails,
                specialRequests: specialRequests.trim(),
                addOnIds: selectedAddOns,
                venueServices: selectedVenueServices,
                downPaymentAmount: parseFloat(downPaymentAmount) || 0,
                fullPaymentAmount: parseFloat(fullPaymentAmount) || 0,
                isDownPaymentMade,
                isFullPaymentMade
            });
            toast.success('Event created successfully');
            setName('');
            setDate(undefined);
            setTime('');
            setVenueId('');
            setClientId('');
            setGuestCount('');
            setDetails(DEFAULT_DETAILS);
            setSpecialRequests('');
            setSelectedAddOns([]);
            setSelectedVenueServices([]);
            setSelectedMenuItems({});
            setDownPaymentAmount('');
            setFullPaymentAmount('');
            setIsDownPaymentMade(false);
            setIsFullPaymentMade(false);
            onOpenChange(false);
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to create event';
            toast.error(errorMessage);
            console.error('Event creation error:', error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New Event</DialogTitle>
                        <DialogDescription>
                            Add a new catering event with all details
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="event-name">Event Name *</Label>
                            <Input
                                id="event-name"
                                placeholder="e.g., Corporate Gala 2025"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={createEvent.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="client">Client *</Label>
                            {!showNewClientForm ? (
                                <div className="flex gap-2">
                                    <Select value={clientId} onValueChange={setClientId} disabled={createEvent.isPending}>
                                        <SelectTrigger id="client" className="flex-1">
                                            <SelectValue placeholder="Select a client" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map((client) => (
                                                <SelectItem key={client.id} value={client.id}>
                                                    {client.firstName} {client.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowNewClientForm(true)}
                                        disabled={createEvent.isPending}
                                    >
                                        <UserPlus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold">Create New Client</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowNewClientForm(false)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Input
                                            placeholder="First Name *"
                                            value={newClientFirstName}
                                            onChange={(e) => setNewClientFirstName(e.target.value)}
                                            disabled={createClient.isPending}
                                        />
                                        <Input
                                            placeholder="Last Name *"
                                            value={newClientLastName}
                                            onChange={(e) => setNewClientLastName(e.target.value)}
                                            disabled={createClient.isPending}
                                        />
                                    </div>
                                    <Input
                                        placeholder="Phone Number *"
                                        value={newClientPhone}
                                        onChange={(e) => setNewClientPhone(e.target.value)}
                                        disabled={createClient.isPending}
                                    />
                                    <Input
                                        placeholder="Email"
                                        type="email"
                                        value={newClientEmail}
                                        onChange={(e) => setNewClientEmail(e.target.value)}
                                        disabled={createClient.isPending}
                                    />
                                    <AddressAutocomplete
                                        placeholder="Address"
                                        value={newClientAddress}
                                        onChange={setNewClientAddress}
                                        disabled={createClient.isPending}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleCreateNewClient}
                                        disabled={createClient.isPending}
                                        className="w-full"
                                    >
                                        {createClient.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Client
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="guestCount">Guest Count *</Label>
                            <Input
                                id="guestCount"
                                type="number"
                                placeholder="Number of guests"
                                value={guestCount}
                                onChange={(e) => setGuestCount(e.target.value)}
                                disabled={createEvent.isPending}
                                min="1"
                            />
                            
                            {addOns.length > 0 && (
                                <div className="space-y-3 bg-card rounded-lg p-4 border">
                                    <Label className="text-sm font-semibold">Event Add-ons</Label>
                                    <div className="space-y-2">
                                        {addOns.map(addOn => (
                                            <div key={addOn.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`addon-${addOn.id}`}
                                                    checked={selectedAddOns.includes(addOn.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedAddOns([...selectedAddOns, addOn.id]);
                                                        } else {
                                                            setSelectedAddOns(selectedAddOns.filter(id => id !== addOn.id));
                                                        }
                                                    }}
                                                    disabled={createEvent.isPending}
                                                />
                                                <Label htmlFor={`addon-${addOn.id}`} className="cursor-pointer font-medium text-sm">
                                                    {addOn.name}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="date">Event Date *</Label>
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                            disabled={createEvent.isPending}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, 'PPP') : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={handleDateSelect}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">Event Time *</Label>
                                <TimePicker
                                    value={time}
                                    onChange={setTime}
                                    disabled={createEvent.isPending}
                                    placeholder="Select time"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="venue">Venue *</Label>
                            {!showNewVenueForm ? (
                                <div className="flex gap-2">
                                    <Select value={venueId} onValueChange={(value) => {
                                        setVenueId(value);
                                        setSelectedVenueServices([]);
                                    }} disabled={createEvent.isPending}>
                                        <SelectTrigger id="venue" className="flex-1">
                                            <SelectValue placeholder="Select a venue" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {venues.map((venue) => (
                                                <SelectItem key={venue.id} value={venue.id}>
                                                    {venue.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowNewVenueForm(true)}
                                        disabled={createEvent.isPending}
                                    >
                                        <MapPin className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-semibold">Create New Venue</Label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowNewVenueForm(false)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Input
                                        placeholder="Venue Name *"
                                        value={newVenueName}
                                        onChange={(e) => setNewVenueName(e.target.value)}
                                        disabled={addVenue.isPending}
                                    />
                                    <AddressAutocomplete
                                        placeholder="Address *"
                                        value={newVenueAddress}
                                        onChange={setNewVenueAddress}
                                        disabled={addVenue.isPending}
                                    />
                                    <Input
                                        placeholder="Phone Number *"
                                        value={newVenuePhone}
                                        onChange={(e) => setNewVenuePhone(e.target.value)}
                                        disabled={addVenue.isPending}
                                    />
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="saveVenue"
                                            checked={saveVenueToDatabase}
                                            onCheckedChange={(checked) => setSaveVenueToDatabase(checked as boolean)}
                                            disabled={addVenue.isPending}
                                        />
                                        <Label htmlFor="saveVenue" className="cursor-pointer text-sm">
                                            Save venue to database for future use
                                        </Label>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleAddVenue}
                                        disabled={addVenue.isPending}
                                        className="w-full"
                                    >
                                        {addVenue.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Add Venue
                                    </Button>
                                </div>
                            )}
                        </div>

                        {selectedVenue && (
                            <>
                                <div className="rounded-lg border bg-muted/30 p-3">
                                    <DistanceDisplay venueAddress={selectedVenue.address} />
                                </div>

                                {selectedVenue.services.length > 0 && (
                                    <div className="space-y-3 bg-card rounded-lg p-4 border">
                                        <Label className="text-sm font-semibold">Venue Services</Label>
                                        <p className="text-xs text-muted-foreground">Select services available at this venue for your event</p>
                                        <div className="space-y-2">
                                            {selectedVenue.services.map(serviceId => (
                                                <div key={serviceId} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`service-${serviceId}`}
                                                        checked={selectedVenueServices.includes(serviceId)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedVenueServices([...selectedVenueServices, serviceId]);
                                                            } else {
                                                                setSelectedVenueServices(selectedVenueServices.filter(id => id !== serviceId));
                                                            }
                                                        }}
                                                        disabled={createEvent.isPending}
                                                    />
                                                    <Label htmlFor={`service-${serviceId}`} className="cursor-pointer font-medium text-sm">
                                                        {getServiceNameById(serviceId)}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <Separator />

                        <div className="space-y-3">
                            <Label className="text-base font-semibold">Menu Details</Label>
                            {visibleCategories.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No menu items available. Add menu items in the Profile tab under User Management.</p>
                            ) : (
                                <div className="space-y-4">
                                    <Select 
                                        value="" 
                                        onValueChange={(categoryId) => handleMenuItemSelect(categoryId)}
                                        disabled={createEvent.isPending}
                                    >
                                        <SelectTrigger className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
                                            <SelectValue placeholder="+ Add Category" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {visibleCategories.map((category) => (
                                                <SelectItem 
                                                    key={category.id} 
                                                    value={category.id}
                                                    disabled={!!selectedMenuItems[category.id]}
                                                    className="cursor-pointer hover:bg-accent"
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {Object.entries(selectedMenuItems).map(([categoryId, data]) => {
                                        const category = visibleCategories.find(c => c.id === categoryId);
                                        if (!category) return null;

                                        return (
                                            <div key={categoryId} className="border rounded-lg p-4 space-y-4 bg-card shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <Label className="font-semibold text-base">{category.name}</Label>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveMenuItem(categoryId)}
                                                        disabled={createEvent.isPending}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-muted-foreground">Start Serving Time</Label>
                                                        <TimePicker
                                                            value={data.beginTime || ''}
                                                            onChange={(value) => handleMenuItemTimeChange(categoryId, 'beginTime', value)}
                                                            disabled={createEvent.isPending}
                                                            placeholder="Start time"
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-muted-foreground">End Serving Time</Label>
                                                        <TimePicker
                                                            value={data.endTime || ''}
                                                            onChange={(value) => handleMenuItemTimeChange(categoryId, 'endTime', value)}
                                                            disabled={createEvent.isPending}
                                                            placeholder="End time"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-sm">Notes</Label>
                                                    <Textarea
                                                        placeholder="Add any notes or special instructions..."
                                                        value={data.notes}
                                                        onChange={(e) => handleMenuItemNotesChange(categoryId, e.target.value)}
                                                        disabled={createEvent.isPending}
                                                        rows={2}
                                                        className="resize-none"
                                                    />
                                                </div>

                                                {category.subcategories.length > 0 && (
                                                    <div className="space-y-2 pt-2 border-t">
                                                        <Label className="text-sm font-medium">Add Items</Label>
                                                        {category.subcategories.map((subcat, idx) => (
                                                            <div key={idx} className="space-y-1">
                                                                <Label className="text-xs text-muted-foreground">{subcat}</Label>
                                                                <Input
                                                                    placeholder={`Enter ${subcat.toLowerCase()}...`}
                                                                    value={data.subcategoryDetails[idx] || ''}
                                                                    onChange={(e) => handleSubcategoryDetailChange(categoryId, idx, e.target.value)}
                                                                    disabled={createEvent.isPending}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label>Event Details to Track</Label>
                            <div className="space-y-2">
                                {details.map((detail) => (
                                    <div
                                        key={detail}
                                        className="flex items-center justify-between rounded-md border bg-muted/50 px-3 py-2"
                                    >
                                        <span className="text-sm">{detail}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveDetail(detail)}
                                            disabled={createEvent.isPending}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add custom detail"
                                    value={newDetail}
                                    onChange={(e) => setNewDetail(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddDetail();
                                        }
                                    }}
                                    disabled={createEvent.isPending}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleAddDetail}
                                    disabled={createEvent.isPending}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="specialRequests">Special Requests</Label>
                            <Textarea
                                id="specialRequests"
                                placeholder="Enter any special requests or notes..."
                                value={specialRequests}
                                onChange={(e) => setSpecialRequests(e.target.value)}
                                disabled={createEvent.isPending}
                                rows={3}
                            />
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <Label className="text-base font-semibold">Payment Details</Label>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="downPayment">Down Payment Amount</Label>
                                    <Input
                                        id="downPayment"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={downPaymentAmount}
                                        onChange={(e) => setDownPaymentAmount(e.target.value)}
                                        disabled={createEvent.isPending}
                                    />
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="downPaymentMade"
                                            checked={isDownPaymentMade}
                                            onCheckedChange={(checked) => setIsDownPaymentMade(checked as boolean)}
                                            disabled={createEvent.isPending}
                                        />
                                        <Label htmlFor="downPaymentMade" className="text-sm font-normal cursor-pointer">
                                            Down payment received
                                        </Label>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fullPayment">Full Payment Amount</Label>
                                    <Input
                                        id="fullPayment"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={fullPaymentAmount}
                                        onChange={(e) => setFullPaymentAmount(e.target.value)}
                                        disabled={createEvent.isPending}
                                    />
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="fullPaymentMade"
                                            checked={isFullPaymentMade}
                                            onCheckedChange={(checked) => setIsFullPaymentMade(checked as boolean)}
                                            disabled={createEvent.isPending}
                                        />
                                        <Label htmlFor="fullPaymentMade" className="text-sm font-normal cursor-pointer">
                                            Full payment received
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={createEvent.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createEvent.isPending}>
                            {createEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Event
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
