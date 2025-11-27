import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Loader2, Plus, X, Calendar as CalendarIcon, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetAllClients, useGetAllVenues, useGetAllStaff, useGetAllMenuCategories, useGetAllAddOns, useGetAllVenueServices, useAssignStaffToPosition, useRemoveStaffFromPosition, useGetDashboardData } from '@/hooks/useQueries';
import { useUpdateEvent } from '@/hooks/useQueries';
import { toast } from 'sonner';
import type { Event, Client, EventDetail, MenuDetail, MenuItem, EventPosition } from '@/backend';
import TimePicker from './TimePicker';
import DistanceDisplay from './DistanceDisplay';

interface EditEventDialogProps {
    event: Event;
    client: Client;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface MenuItemState {
    category: string;
    beginTime?: string;
    endTime?: string;
    notes: string;
    subcategoryDetails: string[];
}

export default function EditEventDialog({ event, client, open, onOpenChange }: EditEventDialogProps) {
    const [eventName, setEventName] = useState(event.name);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date(Number(event.date) / 1000000));
    const [selectedTime, setSelectedTime] = useState(format(new Date(Number(event.date) / 1000000), 'HH:mm'));
    const [selectedClientId, setSelectedClientId] = useState(event.clientId);
    const [selectedVenueId, setSelectedVenueId] = useState('');
    const [guestCount, setGuestCount] = useState(event.guestCount.toString());
    const [specialRequests, setSpecialRequests] = useState(event.specialRequests);
    const [eventDetails, setEventDetails] = useState<EventDetail[]>(event.details);
    const [menuItems, setMenuItems] = useState<MenuItemState[]>([]);
    const [selectedAddOns, setSelectedAddOns] = useState<string[]>(event.addOnIds || []);
    const [selectedVenueServices, setSelectedVenueServices] = useState<string[]>(event.venueServices || []);
    const [staffPositions, setStaffPositions] = useState<EventPosition[]>(event.positions || []);
    const [downPaymentAmount, setDownPaymentAmount] = useState(event.paymentDetails?.downPaymentAmount?.toString() || '');
    const [fullPaymentAmount, setFullPaymentAmount] = useState(event.paymentDetails?.fullPaymentAmount?.toString() || '');
    const [isDownPaymentMade, setIsDownPaymentMade] = useState(event.paymentDetails?.isDownPaymentMade || false);
    const [isFullPaymentMade, setIsFullPaymentMade] = useState(event.paymentDetails?.isFullPaymentMade || false);
    const [assignmentWarning, setAssignmentWarning] = useState<string | null>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const { data: clients = [] } = useGetAllClients();
    const { data: venues = [] } = useGetAllVenues();
    const { data: staff = [] } = useGetAllStaff();
    const { data: menuCategories = [] } = useGetAllMenuCategories();
    const { data: addOns = [] } = useGetAllAddOns();
    const { data: allServices = [] } = useGetAllVenueServices();
    const { data: dashboardData = [] } = useGetDashboardData();
    const updateEvent = useUpdateEvent();
    const assignStaffMutation = useAssignStaffToPosition();
    const removeStaffMutation = useRemoveStaffFromPosition();

    const selectedVenue = venues.find(v => v.id === selectedVenueId);

    const getServiceNameById = (serviceId: string): string => {
        const service = allServices.find(s => s.id === serviceId);
        return service ? service.name : serviceId;
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date);
        }
        setIsCalendarOpen(false);
    };

    // Check if staff is already assigned to another event on the same date
    const isStaffDoubleBooked = (staffId: string, currentEventId: string, eventDate: Date): boolean => {
        const allEvents = dashboardData.flatMap(([_, events]) => events);
        
        return allEvents.some(e => {
            if (e.id === currentEventId || e.isArchived) return false;
            
            const eDate = new Date(Number(e.date) / 1000000);
            const sameDate = eDate.toDateString() === eventDate.toDateString();
            
            if (!sameDate) return false;
            
            // Check if staff is assigned to any position in this event
            return e.positions.some(pos => pos.assignedStaff.includes(staffId));
        });
    };

    // Check if staff is already assigned to another position in the same event
    const isStaffAssignedToOtherPosition = (staffId: string, currentPosition: string): boolean => {
        return staffPositions.some(pos => 
            pos.position !== currentPosition && pos.assignedStaff.includes(staffId)
        );
    };

    useEffect(() => {
        if (open) {
            setEventName(event.name);
            setSelectedDate(new Date(Number(event.date) / 1000000));
            setSelectedTime(format(new Date(Number(event.date) / 1000000), 'HH:mm'));
            setSelectedClientId(event.clientId);
            
            // Find venue by matching the venue name from the event
            const matchedVenue = venues.find(v => v.name === event.venue || v.id === event.venue);
            setSelectedVenueId(matchedVenue ? matchedVenue.id : event.venue);
            
            setGuestCount(event.guestCount.toString());
            setSpecialRequests(event.specialRequests);
            setEventDetails(event.details);
            setSelectedAddOns(event.addOnIds || []);
            setSelectedVenueServices(event.venueServices || []);
            setStaffPositions(event.positions || []);
            setDownPaymentAmount(event.paymentDetails?.downPaymentAmount?.toString() || '');
            setFullPaymentAmount(event.paymentDetails?.fullPaymentAmount?.toString() || '');
            setIsDownPaymentMade(event.paymentDetails?.isDownPaymentMade || false);
            setIsFullPaymentMade(event.paymentDetails?.isFullPaymentMade || false);
            setAssignmentWarning(null);

            // Convert menuDetails to MenuItemState
            const convertedMenuItems: MenuItemState[] = event.menuDetails.map(menu => {
                const category = menuCategories.find(c => c.name === menu.category);
                const beginTime = menu.beginServingTime ? format(new Date(Number(menu.beginServingTime) / 1000000), 'HH:mm') : '';
                const endTime = menu.endServingTime ? format(new Date(Number(menu.endServingTime) / 1000000), 'HH:mm') : '';
                
                return {
                    category: menu.category,
                    beginTime,
                    endTime,
                    notes: menu.notes || '',
                    subcategoryDetails: category ? category.subcategories.map((subcat, idx) => {
                        const item = menu.items[0];
                        return item?.details[idx] || '';
                    }) : []
                };
            });
            setMenuItems(convertedMenuItems);
        }
    }, [open, event, menuCategories, venues]);

    const handleAddEventDetail = () => {
        setEventDetails([...eventDetails, { name: '', specificInfo: '', isConfirmed: false }]);
    };

    const handleRemoveEventDetail = (index: number) => {
        setEventDetails(eventDetails.filter((_, i) => i !== index));
    };

    const handleEventDetailChange = (index: number, field: keyof EventDetail, value: string | boolean) => {
        const updated = [...eventDetails];
        updated[index] = { ...updated[index], [field]: value };
        setEventDetails(updated);
    };

    const handleAddMenuItem = () => {
        setMenuItems([...menuItems, { category: '', beginTime: '', endTime: '', notes: '', subcategoryDetails: [] }]);
    };

    const handleRemoveMenuItem = (index: number) => {
        setMenuItems(menuItems.filter((_, i) => i !== index));
    };

    const handleMenuItemChange = (index: number, field: keyof MenuItemState, value: any) => {
        const updated = [...menuItems];
        if (field === 'category') {
            const category = menuCategories.find(c => c.name === value);
            updated[index] = {
                ...updated[index],
                [field]: value,
                subcategoryDetails: category ? category.subcategories.map(() => '') : []
            };
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setMenuItems(updated);
    };

    const handleSubcategoryChange = (menuIndex: number, subcatIndex: number, value: string) => {
        const updated = [...menuItems];
        updated[menuIndex].subcategoryDetails[subcatIndex] = value;
        setMenuItems(updated);
    };

    const handleAssignStaff = async (positionIndex: number, slotIndex: number, staffId: string) => {
        const position = staffPositions[positionIndex];
        
        // Clear any previous warnings
        setAssignmentWarning(null);
        
        // Check for double booking on same date
        const eventDate = new Date(selectedDate);
        const [hours, minutes] = selectedTime.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);
        
        if (isStaffDoubleBooked(staffId, event.id, eventDate)) {
            const staffMember = staff.find(s => s.id === staffId);
            const staffName = staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'This staff member';
            setAssignmentWarning(`${staffName} is already assigned to another event on ${format(eventDate, 'MMM d, yyyy')}. Please choose a different staff member.`);
            return;
        }
        
        // Check if staff is already assigned to another position in this event
        if (isStaffAssignedToOtherPosition(staffId, position.position)) {
            const staffMember = staff.find(s => s.id === staffId);
            const staffName = staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'This staff member';
            setAssignmentWarning(`${staffName} is already assigned to another position in this event. Please choose a different staff member.`);
            return;
        }
        
        try {
            await assignStaffMutation.mutateAsync({
                eventId: event.id,
                position: position.position,
                staffId
            });
            
            setStaffPositions(prev => prev.map((pos, idx) => {
                if (idx === positionIndex) {
                    const newAssignedStaff = [...pos.assignedStaff];
                    if (slotIndex < newAssignedStaff.length) {
                        newAssignedStaff[slotIndex] = staffId;
                    } else {
                        newAssignedStaff.push(staffId);
                    }
                    return {
                        ...pos,
                        assignedStaff: newAssignedStaff
                    };
                }
                return pos;
            }));
            
            toast.success('Staff assigned successfully');
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to assign staff';
            
            if (errorMessage.includes('already assigned to this position')) {
                setAssignmentWarning('This staff member is already assigned to this position.');
            } else if (errorMessage.includes('already assigned to another event')) {
                setAssignmentWarning('This staff member is already assigned to another event at the same time.');
            } else {
                toast.error(errorMessage);
            }
            console.error(error);
        }
    };

    const handleRemoveStaff = async (positionIndex: number, slotIndex: number) => {
        const position = staffPositions[positionIndex];
        const staffId = position.assignedStaff[slotIndex];
        
        if (!staffId) return;
        
        // Clear any warnings
        setAssignmentWarning(null);
        
        try {
            await removeStaffMutation.mutateAsync({
                eventId: event.id,
                position: position.position,
                staffId
            });
            
            setStaffPositions(prev => prev.map((pos, idx) => {
                if (idx === positionIndex) {
                    const newAssignedStaff = pos.assignedStaff.filter((_, i) => i !== slotIndex);
                    return {
                        ...pos,
                        assignedStaff: newAssignedStaff
                    };
                }
                return pos;
            }));
            
            toast.success('Staff removed successfully');
        } catch (error) {
            toast.error('Failed to remove staff');
            console.error(error);
        }
    };

    const getAvailableStaffForPosition = (position: string, excludeIds: string[] = []) => {
        const eventDate = new Date(selectedDate);
        const [hours, minutes] = selectedTime.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);
        
        return staff.filter(s => {
            // Must have the required position
            if (!s.positions.includes(position)) return false;
            
            // Exclude already assigned staff in this position
            if (excludeIds.includes(s.id)) return false;
            
            // Exclude staff assigned to other positions in this event
            if (isStaffAssignedToOtherPosition(s.id, position)) return false;
            
            // Exclude staff double-booked on same date
            if (isStaffDoubleBooked(s.id, event.id, eventDate)) return false;
            
            return true;
        });
    };

    const handleSubmit = async () => {
        if (!eventName.trim()) {
            toast.error('Please enter an event name');
            return;
        }

        if (!selectedClientId) {
            toast.error('Please select a client');
            return;
        }

        if (!selectedVenueId) {
            toast.error('Please select a venue');
            return;
        }

        const guestCountNum = parseInt(guestCount);
        if (isNaN(guestCountNum) || guestCountNum <= 0) {
            toast.error('Please enter a valid guest count');
            return;
        }

        try {
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const eventDateTime = new Date(selectedDate);
            eventDateTime.setHours(hours, minutes, 0, 0);
            const eventTimestamp = BigInt(eventDateTime.getTime() * 1000000);

            // Convert MenuItemState back to MenuDetail
            const menuDetails: MenuDetail[] = menuItems.map(item => {
                const category = menuCategories.find(c => c.name === item.category);
                
                let beginServingTime: bigint | undefined;
                let endServingTime: bigint | undefined;
                
                if (item.beginTime) {
                    const [bHours, bMinutes] = item.beginTime.split(':');
                    const beginDate = new Date(selectedDate);
                    beginDate.setHours(parseInt(bHours), parseInt(bMinutes));
                    beginServingTime = BigInt(beginDate.getTime()) * BigInt(1000000);
                }
                
                if (item.endTime) {
                    const [eHours, eMinutes] = item.endTime.split(':');
                    const endDate = new Date(selectedDate);
                    endDate.setHours(parseInt(eHours), parseInt(eMinutes));
                    endServingTime = BigInt(endDate.getTime()) * BigInt(1000000);
                }

                const items: MenuItem[] = [{
                    name: item.category,
                    details: item.subcategoryDetails.filter(d => d.trim() !== '')
                }];

                return {
                    category: item.category,
                    items,
                    beginServingTime,
                    endServingTime,
                    notes: item.notes
                };
            });

            // Get the venue name to save - use the selected venue's name if it exists in the database
            const venueToSave = selectedVenue ? selectedVenue.name : selectedVenueId;

            // The backend's updateEvent function automatically preserves staff assignments
            // when positions are regenerated. Staff assignments are managed separately
            // via assignStaffToEvent and unassignStaffFromEvent mutations.
            await updateEvent.mutateAsync({
                id: event.id,
                name: eventName,
                date: eventTimestamp,
                venue: venueToSave,
                clientId: selectedClientId,
                guestCount: BigInt(guestCountNum),
                details: eventDetails,
                staffAssignments: event.staffAssignments,
                menuDetails: menuDetails,
                specialRequests: specialRequests,
                addOnIds: selectedAddOns,
                depositAmount: event.depositAmount,
                totalCost: event.totalCost,
                paymentStatus: event.paymentStatus,
                venueServices: selectedVenueServices,
                downPaymentAmount: parseFloat(downPaymentAmount) || 0,
                fullPaymentAmount: parseFloat(fullPaymentAmount) || 0,
                isDownPaymentMade,
                isFullPaymentMade
            });

            toast.success('Event updated successfully');
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to update event');
            console.error(error);
        }
    };

    const isUpdating = updateEvent.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
                    <DialogTitle className="text-2xl">Edit Event</DialogTitle>
                    <DialogDescription>
                        Update event details for {client.firstName} {client.lastName}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6 overflow-y-auto">
                    <div className="space-y-6 py-6">
                        {/* Assignment Warning */}
                        {assignmentWarning && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{assignmentWarning}</AlertDescription>
                            </Alert>
                        )}

                        {/* Basic Information */}
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="event-name">Event Name *</Label>
                                <Input
                                    id="event-name"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    placeholder="e.g., Wedding Reception"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label>Event Date *</Label>
                                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {format(selectedDate, 'PPP')}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={handleDateSelect}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div>
                                    <Label>Event Time *</Label>
                                    <TimePicker value={selectedTime} onChange={setSelectedTime} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="client">Client *</Label>
                                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                        <SelectTrigger id="client">
                                            <SelectValue placeholder="Select client" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.firstName} {c.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="venue">Venue *</Label>
                                    <Select value={selectedVenueId} onValueChange={(value) => {
                                        setSelectedVenueId(value);
                                        setSelectedVenueServices([]);
                                    }}>
                                        <SelectTrigger id="venue">
                                            <SelectValue placeholder="Select venue" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {venues.map((v) => (
                                                <SelectItem key={v.id} value={v.id}>
                                                    {v.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {selectedVenue && (
                                <>
                                    <DistanceDisplay venueAddress={selectedVenue.address} className="mt-2" />

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

                            <div>
                                <Label htmlFor="guest-count">Guest Count *</Label>
                                <Input
                                    id="guest-count"
                                    type="number"
                                    min="1"
                                    value={guestCount}
                                    onChange={(e) => setGuestCount(e.target.value)}
                                    placeholder="Number of guests"
                                />
                                <Alert className="mt-2 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                                        Changing guest count or add-ons will recalculate staff positions when you save. <strong>Your existing staff assignments will be preserved automatically.</strong>
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </div>

                        <Separator />

                        {/* Add-Ons */}
                        {addOns.length > 0 && (
                            <>
                                <div className="space-y-4">
                                    <Label className="text-base font-semibold">Event Add-Ons</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Select add-ons to automatically include associated staff positions
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {addOns.map((addOn) => (
                                            <div key={addOn.id} className="flex items-start space-x-2 p-3 border rounded-lg hover:bg-accent/5">
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
                                                />
                                                <div className="flex-1">
                                                    <Label htmlFor={`addon-${addOn.id}`} className="text-sm font-medium cursor-pointer">
                                                        {addOn.name}
                                                    </Label>
                                                    {addOn.associatedPositions.length > 0 && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Adds: {addOn.associatedPositions.join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <Separator />
                            </>
                        )}

                        {/* Staff Assignment Section */}
                        {staffPositions.length > 0 && (
                            <>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-base font-semibold">Staff Assignments</Label>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Assign staff members to positions. Staff cannot be double-booked or assigned to multiple positions in the same event.
                                        </p>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {staffPositions.map((pos, posIdx) => {
                                            const requiredCount = Number(pos.requiredCount);
                                            const assignedStaffIds = pos.assignedStaff || [];
                                            const availableStaff = getAvailableStaffForPosition(pos.position, assignedStaffIds);
                                            
                                            return (
                                                <div key={posIdx} className="border rounded-lg p-4 bg-card space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-semibold text-sm">{pos.position}</h4>
                                                        <Badge variant={assignedStaffIds.length >= requiredCount ? "default" : "secondary"} className="text-xs">
                                                            {assignedStaffIds.length}/{requiredCount}
                                                        </Badge>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        {Array.from({ length: requiredCount }).map((_, slotIdx) => {
                                                            const assignedStaffId = assignedStaffIds[slotIdx];
                                                            const assignedStaffMember = assignedStaffId ? staff.find(s => s.id === assignedStaffId) : null;
                                                            
                                                            return (
                                                                <div key={slotIdx} className="space-y-1">
                                                                    <Label className="text-xs text-muted-foreground">
                                                                        Position {slotIdx + 1}
                                                                    </Label>
                                                                    <div className="flex gap-1">
                                                                        <Select
                                                                            value={assignedStaffId || ""}
                                                                            onValueChange={(value) => {
                                                                                if (value) {
                                                                                    handleAssignStaff(posIdx, slotIdx, value);
                                                                                }
                                                                            }}
                                                                            disabled={assignStaffMutation.isPending || removeStaffMutation.isPending}
                                                                        >
                                                                            <SelectTrigger className="h-9 text-xs">
                                                                                <SelectValue placeholder="Select staff">
                                                                                    {assignedStaffMember ? (
                                                                                        <span className="truncate">
                                                                                            {assignedStaffMember.firstName} {assignedStaffMember.lastName}
                                                                                        </span>
                                                                                    ) : (
                                                                                        "Select staff"
                                                                                    )}
                                                                                </SelectValue>
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {assignedStaffMember && (
                                                                                    <SelectItem value={assignedStaffMember.id}>
                                                                                        {assignedStaffMember.firstName} {assignedStaffMember.lastName}
                                                                                    </SelectItem>
                                                                                )}
                                                                                {availableStaff.map(s => (
                                                                                    <SelectItem key={s.id} value={s.id}>
                                                                                        {s.firstName} {s.lastName}
                                                                                    </SelectItem>
                                                                                ))}
                                                                                {availableStaff.length === 0 && !assignedStaffMember && (
                                                                                    <SelectItem value="none" disabled>
                                                                                        No staff available
                                                                                    </SelectItem>
                                                                                )}
                                                                            </SelectContent>
                                                                        </Select>
                                                                        {assignedStaffId && (
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-9 w-9 p-0 shrink-0"
                                                                                onClick={() => handleRemoveStaff(posIdx, slotIdx)}
                                                                                disabled={removeStaffMutation.isPending}
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    
                                                    {availableStaff.length === 0 && assignedStaffIds.length === 0 && (
                                                        <p className="text-xs text-muted-foreground italic">
                                                            No staff members available for this position
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <Separator />
                            </>
                        )}

                        {/* Menu Items */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Menu Details</Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddMenuItem}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Category
                                </Button>
                            </div>

                            {menuItems.map((item, index) => {
                                const category = menuCategories.find(c => c.name === item.category);
                                
                                return (
                                    <div key={index} className="border rounded-lg p-4 space-y-4 bg-card shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <Select
                                                value={item.category}
                                                onValueChange={(value) => handleMenuItemChange(index, 'category', value)}
                                            >
                                                <SelectTrigger className="flex-1 max-w-xs">
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {menuCategories.map((cat) => (
                                                        <SelectItem key={cat.id} value={cat.name}>
                                                            {cat.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveMenuItem(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">Start Serving Time</Label>
                                                <TimePicker
                                                    value={item.beginTime || ''}
                                                    onChange={(value) => handleMenuItemChange(index, 'beginTime', value)}
                                                    placeholder="Start time"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-muted-foreground">End Serving Time</Label>
                                                <TimePicker
                                                    value={item.endTime || ''}
                                                    onChange={(value) => handleMenuItemChange(index, 'endTime', value)}
                                                    placeholder="End time"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-sm">Notes</Label>
                                            <Textarea
                                                placeholder="Add any notes or special instructions..."
                                                value={item.notes}
                                                onChange={(e) => handleMenuItemChange(index, 'notes', e.target.value)}
                                                rows={2}
                                                className="resize-none"
                                            />
                                        </div>

                                        {category && category.subcategories.length > 0 && (
                                            <div className="space-y-2 pt-2 border-t">
                                                <Label className="text-sm font-medium">Add Items</Label>
                                                {category.subcategories.map((subcat, subcatIdx) => (
                                                    <div key={subcatIdx} className="space-y-1">
                                                        <Label className="text-xs text-muted-foreground">{subcat}</Label>
                                                        <Input
                                                            placeholder={`Enter ${subcat.toLowerCase()}...`}
                                                            value={item.subcategoryDetails[subcatIdx] || ''}
                                                            onChange={(e) => handleSubcategoryChange(index, subcatIdx, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <Separator />

                        {/* Event Details */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-semibold">Event Details</Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddEventDetail}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Detail
                                </Button>
                            </div>

                            {eventDetails.map((detail, index) => (
                                <div key={index} className="space-y-2 p-4 border rounded-lg">
                                    <div className="flex items-center justify-between gap-2">
                                        <Input
                                            value={detail.name}
                                            onChange={(e) => handleEventDetailChange(index, 'name', e.target.value)}
                                            placeholder="Detail name (e.g., Cake)"
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveEventDetail(index)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Textarea
                                        value={detail.specificInfo}
                                        onChange={(e) => handleEventDetailChange(index, 'specificInfo', e.target.value)}
                                        placeholder="Specific information"
                                        rows={2}
                                    />
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`confirmed-${index}`}
                                            checked={detail.isConfirmed}
                                            onCheckedChange={(checked) => handleEventDetailChange(index, 'isConfirmed', checked as boolean)}
                                        />
                                        <Label htmlFor={`confirmed-${index}`} className="text-sm font-normal">
                                            Confirmed
                                        </Label>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Separator />

                        {/* Special Requests */}
                        <div className="space-y-2">
                            <Label htmlFor="special-requests">Special Requests</Label>
                            <Textarea
                                id="special-requests"
                                value={specialRequests}
                                onChange={(e) => setSpecialRequests(e.target.value)}
                                placeholder="Any special requests or notes..."
                                rows={4}
                            />
                        </div>

                        <Separator />

                        {/* Payment Details */}
                        <div className="space-y-4">
                            <Label className="text-base font-semibold">Payment Details</Label>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-downPayment">Down Payment Amount</Label>
                                    <Input
                                        id="edit-downPayment"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={downPaymentAmount}
                                        onChange={(e) => setDownPaymentAmount(e.target.value)}
                                    />
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="edit-downPaymentMade"
                                            checked={isDownPaymentMade}
                                            onCheckedChange={(checked) => setIsDownPaymentMade(checked as boolean)}
                                        />
                                        <Label htmlFor="edit-downPaymentMade" className="text-sm font-normal cursor-pointer">
                                            Down payment received
                                        </Label>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-fullPayment">Full Payment Amount</Label>
                                    <Input
                                        id="edit-fullPayment"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={fullPaymentAmount}
                                        onChange={(e) => setFullPaymentAmount(e.target.value)}
                                    />
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="edit-fullPaymentMade"
                                            checked={isFullPaymentMade}
                                            onCheckedChange={(checked) => setIsFullPaymentMade(checked as boolean)}
                                        />
                                        <Label htmlFor="edit-fullPaymentMade" className="text-sm font-normal cursor-pointer">
                                            Full payment received
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 shrink-0 border-t bg-background">
                    <div className="flex items-center justify-end gap-2 w-full">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isUpdating}>
                            {isUpdating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Event'
                            )}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
