import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Eye, Trash2, Loader2, ArrowUpDown, Columns3, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
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
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGetAllVenues, useGetAllStaff, useDeleteEvent, useGetAllMenuCategories } from '@/hooks/useQueries';
import { toast } from 'sonner';
import type { Client, Event } from '@/backend';
import EditEventDialog from './EditEventDialog';

interface EventsOverviewProps {
    dashboardData: [Client, Event[]][];
    urgentEvents: Event[];
    isLoading: boolean;
}

type SortMode = 'date' | 'client';

export default function EventsOverview({ dashboardData, urgentEvents, isLoading }: EventsOverviewProps) {
    const [selectedEvent, setSelectedEvent] = useState<{ event: Event; client: Client } | null>(null);
    const [editingEvent, setEditingEvent] = useState<{ event: Event; client: Client } | null>(null);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);
    const [sortMode, setSortMode] = useState<SortMode>('date');
    const [visibleColumns, setVisibleColumns] = useState({
        date: true,
        client: true,
        venue: true,
        guests: true,
        completion: true,
        outstanding: true,
        staff: true,
    });

    const { data: venues = [] } = useGetAllVenues();
    const { data: staff = [] } = useGetAllStaff();
    const { data: menuCategories = [] } = useGetAllMenuCategories();
    const deleteEvent = useDeleteEvent();

    const allEvents = useMemo(() => {
        const events = dashboardData.flatMap(([client, events]) =>
            events.filter(event => !event.isArchived).map(event => ({ event, client }))
        );

        if (sortMode === 'date') {
            return events.sort((a, b) => Number(a.event.date) - Number(b.event.date));
        } else {
            return events.sort((a, b) => a.client.lastName.localeCompare(b.client.lastName));
        }
    }, [dashboardData, sortMode]);

    const getVenueName = (venueId: string) => {
        const venue = venues.find(v => v.id === venueId);
        return venue?.name || venueId;
    };

    const getCompletionStatus = (event: Event) => {
        const confirmedCount = event.details.filter(d => d.isConfirmed).length;
        const totalCount = event.details.length;
        return { confirmedCount, totalCount, percentage: totalCount > 0 ? (confirmedCount / totalCount) * 100 : 0 };
    };

    const getOutstandingDetails = (event: Event) => {
        return event.details.filter(d => !d.isConfirmed).map(d => d.name);
    };

    const getStaffInfo = (staffAssignments: Array<{ staffId: string; position: string }>) => {
        return staffAssignments.map(assignment => {
            const staffMember = staff.find(s => s.id === assignment.staffId);
            return {
                name: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Unknown',
                position: assignment.position
            };
        });
    };

    const handleDeleteEvent = async () => {
        if (!eventToDelete) return;

        try {
            await deleteEvent.mutateAsync(eventToDelete);
            toast.success('Event deleted successfully');
            setEventToDelete(null);
        } catch (error) {
            toast.error('Failed to delete event');
            console.error(error);
        }
    };

    const toggleSort = () => {
        setSortMode(prev => prev === 'date' ? 'client' : 'date');
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader className="px-3 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <CardTitle className="text-lg sm:text-xl">Events Overview</CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                                All upcoming events sorted by {sortMode === 'date' ? 'date (soonest first)' : 'client name (A-Z)'}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                                        <Columns3 className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span className="hidden sm:inline">Columns</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.date}
                                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, date: checked }))}
                                    >
                                        Date & Time
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.client}
                                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, client: checked }))}
                                    >
                                        Client
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.venue}
                                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, venue: checked }))}
                                    >
                                        Venue
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.guests}
                                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, guests: checked }))}
                                    >
                                        Guests
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.completion}
                                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, completion: checked }))}
                                    >
                                        Completion
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.outstanding}
                                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, outstanding: checked }))}
                                    >
                                        Outstanding
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.staff}
                                        onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, staff: checked }))}
                                    >
                                        Staff
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button variant="outline" size="sm" onClick={toggleSort} className="text-xs sm:text-sm">
                                <ArrowUpDown className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Sort by {sortMode === 'date' ? 'Client' : 'Date'}</span>
                                <span className="sm:hidden">Sort</span>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                    {allEvents.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground px-3">
                            No upcoming events scheduled
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            <div className="rounded-md border min-w-[1000px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs sm:text-sm min-w-[150px]">Event Name</TableHead>
                                            {visibleColumns.date && <TableHead className="text-xs sm:text-sm min-w-[140px]">Date & Time</TableHead>}
                                            {visibleColumns.client && <TableHead className="text-xs sm:text-sm min-w-[150px]">Client</TableHead>}
                                            {visibleColumns.venue && <TableHead className="text-xs sm:text-sm min-w-[120px]">Venue</TableHead>}
                                            {visibleColumns.guests && <TableHead className="text-xs sm:text-sm min-w-[80px]">Guests</TableHead>}
                                            {visibleColumns.completion && <TableHead className="text-xs sm:text-sm min-w-[100px]">Completion</TableHead>}
                                            {visibleColumns.outstanding && <TableHead className="text-xs sm:text-sm min-w-[150px]">Outstanding</TableHead>}
                                            {visibleColumns.staff && <TableHead className="text-xs sm:text-sm min-w-[200px]">Staff</TableHead>}
                                            <TableHead className="text-right text-xs sm:text-sm min-w-[140px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allEvents.map(({ event, client }) => {
                                            const eventDate = new Date(Number(event.date) / 1000000);
                                            const status = getCompletionStatus(event);
                                            const outstanding = getOutstandingDetails(event);
                                            const staffInfo = getStaffInfo(event.staffAssignments);

                                            return (
                                                <TableRow key={event.id} id={`event-${event.id}`}>
                                                    <TableCell className="font-medium text-xs sm:text-sm">{event.name}</TableCell>
                                                    {visibleColumns.date && (
                                                        <TableCell>
                                                            <div className="text-xs sm:text-sm">
                                                                <div>{format(eventDate, 'MMM d, yyyy')}</div>
                                                                <div className="text-muted-foreground">{format(eventDate, 'h:mm a')}</div>
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                    {visibleColumns.client && (
                                                        <TableCell>
                                                            <div className="text-xs sm:text-sm">
                                                                <div>{client.firstName} {client.lastName}</div>
                                                                <div className="text-muted-foreground">{client.phoneNumber}</div>
                                                            </div>
                                                        </TableCell>
                                                    )}
                                                    {visibleColumns.venue && <TableCell className="text-xs sm:text-sm">{getVenueName(event.venue)}</TableCell>}
                                                    {visibleColumns.guests && <TableCell className="text-xs sm:text-sm">{event.guestCount.toString()}</TableCell>}
                                                    {visibleColumns.completion && (
                                                        <TableCell>
                                                            <Badge variant={status.percentage === 100 ? 'default' : 'secondary'} className="text-xs">
                                                                {status.confirmedCount}/{status.totalCount}
                                                            </Badge>
                                                        </TableCell>
                                                    )}
                                                    {visibleColumns.outstanding && (
                                                        <TableCell>
                                                            {outstanding.length > 0 ? (
                                                                <div className="text-xs space-y-1">
                                                                    {outstanding.map((detail, idx) => (
                                                                        <div key={idx} className="text-amber-600 dark:text-amber-400">
                                                                            • {detail}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">None</span>
                                                            )}
                                                        </TableCell>
                                                    )}
                                                    {visibleColumns.staff && (
                                                        <TableCell>
                                                            {staffInfo.length > 0 ? (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {staffInfo.map((info, idx) => (
                                                                        <Badge key={idx} variant="outline" className="text-xs">
                                                                            {info.name} ({info.position})
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">None</span>
                                                            )}
                                                        </TableCell>
                                                    )}
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1 sm:gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setSelectedEvent({ event, client })}
                                                            >
                                                                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setEditingEvent({ event, client })}
                                                            >
                                                                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setEventToDelete(event.id)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Event Details Dialog - comprehensive view */}
            <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
                <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl sm:text-2xl pr-8">{selectedEvent?.event.name}</DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                            {selectedEvent && format(new Date(Number(selectedEvent.event.date) / 1000000), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEvent && (
                        <div className="space-y-4 sm:space-y-6">
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                <div>
                                    <h4 className="mb-2 text-xs sm:text-sm font-semibold text-muted-foreground">Client</h4>
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm sm:text-base">{selectedEvent.client.firstName} {selectedEvent.client.lastName}</p>
                                        <p className="text-xs sm:text-sm text-muted-foreground break-all">{selectedEvent.client.email}</p>
                                        <p className="text-xs sm:text-sm text-muted-foreground">{selectedEvent.client.phoneNumber}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="mb-2 text-xs sm:text-sm font-semibold text-muted-foreground">Venue</h4>
                                    <p className="font-medium text-sm sm:text-base">{getVenueName(selectedEvent.event.venue)}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="mb-2 text-xs sm:text-sm font-semibold text-muted-foreground">Guest Count</h4>
                                <p className="font-medium text-sm sm:text-base">{selectedEvent.event.guestCount.toString()} guests</p>
                            </div>

                            {selectedEvent.event.staffAssignments.length > 0 && (
                                <div>
                                    <h4 className="mb-3 text-xs sm:text-sm font-semibold text-muted-foreground">Assigned Staff</h4>
                                    <div className="space-y-2">
                                        {getStaffInfo(selectedEvent.event.staffAssignments).map((info, idx) => (
                                            <div key={idx} className="flex items-center gap-2 rounded-lg border p-2 sm:p-3">
                                                <Badge variant="outline" className="text-xs">
                                                    {info.position}
                                                </Badge>
                                                <span className="text-sm font-medium">{info.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedEvent.event.menuDetails.length > 0 && (
                                <div>
                                    <h4 className="mb-3 text-xs sm:text-sm font-semibold text-muted-foreground">Menu Details</h4>
                                    <div className="space-y-3">
                                        {selectedEvent.event.menuDetails.map((menuDetail, idx) => (
                                            <div key={idx} className="rounded-lg border p-3 space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h5 className="font-semibold text-sm">{menuDetail.category}</h5>
                                                    {(menuDetail.beginServingTime || menuDetail.endServingTime) && (
                                                        <div className="text-xs text-muted-foreground">
                                                            {menuDetail.beginServingTime && format(new Date(Number(menuDetail.beginServingTime) / 1000000), 'h:mm a')}
                                                            {menuDetail.beginServingTime && menuDetail.endServingTime && ' - '}
                                                            {menuDetail.endServingTime && format(new Date(Number(menuDetail.endServingTime) / 1000000), 'h:mm a')}
                                                        </div>
                                                    )}
                                                </div>
                                                {menuDetail.items.map((item, itemIdx) => (
                                                    <div key={itemIdx} className="space-y-1.5 pl-3">
                                                        <p className="font-medium text-sm">{item.name}</p>
                                                        {item.details.length > 0 && (
                                                            <div className="space-y-1">
                                                                {item.details.map((detail, detailIdx) => (
                                                                    detail && (
                                                                        <p key={detailIdx} className="text-sm text-muted-foreground pl-3 border-l-2 border-muted">
                                                                            {detail}
                                                                        </p>
                                                                    )
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {menuDetail.notes && (
                                                    <div className="mt-2 pt-2 border-t">
                                                        <p className="text-xs text-muted-foreground">
                                                            <span className="font-semibold">Notes:</span> {menuDetail.notes}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedEvent.event.specialRequests && (
                                <div>
                                    <h4 className="mb-2 text-xs sm:text-sm font-semibold text-muted-foreground">Special Requests</h4>
                                    <p className="text-xs sm:text-sm break-words">{selectedEvent.event.specialRequests}</p>
                                </div>
                            )}

                            <Separator />

                            <div>
                                <h4 className="mb-3 text-xs sm:text-sm font-semibold text-muted-foreground">Payment Details</h4>
                                <div className="space-y-3 rounded-lg border p-3 sm:p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Down Payment</p>
                                            <p className="text-lg font-bold">
                                                ${selectedEvent.event.paymentDetails.downPaymentAmount.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox 
                                                checked={selectedEvent.event.paymentDetails.isDownPaymentMade}
                                                disabled
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {selectedEvent.event.paymentDetails.isDownPaymentMade ? 'Paid' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Full Payment</p>
                                            <p className="text-lg font-bold">
                                                ${selectedEvent.event.paymentDetails.fullPaymentAmount.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox 
                                                checked={selectedEvent.event.paymentDetails.isFullPaymentMade}
                                                disabled
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {selectedEvent.event.paymentDetails.isFullPaymentMade ? 'Paid' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold text-muted-foreground">Event Details</h4>
                                <div className="space-y-2 sm:space-y-3">
                                    {selectedEvent.event.details.map((detail, index) => (
                                        <div key={index} className="flex items-start gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3">
                                            <div className="flex-1 space-y-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="font-medium text-xs sm:text-sm truncate">{detail.name}</p>
                                                    <Badge variant={detail.isConfirmed ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                                                        {detail.isConfirmed ? 'Confirmed' : 'Pending'}
                                                    </Badge>
                                                </div>
                                                {detail.specificInfo && (
                                                    <p className="text-xs sm:text-sm text-muted-foreground break-words">{detail.specificInfo}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Event Dialog */}
            {editingEvent && (
                <EditEventDialog
                    event={editingEvent.event}
                    client={editingEvent.client}
                    open={!!editingEvent}
                    onOpenChange={(open) => !open && setEditingEvent(null)}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!eventToDelete} onOpenChange={() => setEventToDelete(null)}>
                <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the event and all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel disabled={deleteEvent.isPending} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteEvent}
                            disabled={deleteEvent.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                        >
                            {deleteEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
