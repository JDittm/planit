import { useState } from 'react';
import { format } from 'date-fns';
import { Archive, Eye, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { useGetArchivedEvents, useGetAllClients, useGetAllStaff, useGetAllVenues } from '@/hooks/useQueries';
import type { Event } from '@/backend';

export default function ArchivedEvents() {
    const [viewDetailsEvent, setViewDetailsEvent] = useState<Event | null>(null);

    const { data: archivedEvents = [], isLoading } = useGetArchivedEvents();
    const { data: clients = [] } = useGetAllClients();
    const { data: staff = [] } = useGetAllStaff();
    const { data: venues = [] } = useGetAllVenues();

    const sortedEvents = [...archivedEvents].sort((a, b) => Number(b.date - a.date));

    const getClientName = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        return client ? `${client.firstName} ${client.lastName}` : 'Unknown';
    };

    const getVenueName = (venueId: string) => {
        const venue = venues.find(v => v.id === venueId);
        return venue?.name || venueId;
    };

    const getStaffNames = (staffAssignments: Array<{ staffId: string; position: string }>) => {
        return staffAssignments.map(assignment => {
            const staffMember = staff.find(s => s.id === assignment.staffId);
            return {
                name: staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Unknown',
                position: assignment.position
            };
        });
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Archive className="h-5 w-5" />
                        Archived Events
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (sortedEvents.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Archive className="h-5 w-5" />
                        Archived Events
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Archive className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">No Archived Events</h3>
                        <p className="text-sm text-muted-foreground">
                            Past events will be automatically archived here
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Archive className="h-5 w-5" />
                        Archived Events ({sortedEvents.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Event Name</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Venue</TableHead>
                                    <TableHead>Guest Count</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedEvents.map((event) => (
                                    <TableRow key={event.id}>
                                        <TableCell>
                                            {format(new Date(Number(event.date) / 1000000), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="font-medium">{event.name}</TableCell>
                                        <TableCell>{getClientName(event.clientId)}</TableCell>
                                        <TableCell>{getVenueName(event.venue)}</TableCell>
                                        <TableCell>{event.guestCount.toString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setViewDetailsEvent(event)}
                                            >
                                                <Eye className="mr-2 h-4 w-4" />
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* View Details Dialog - comprehensive view */}
            <Dialog open={!!viewDetailsEvent} onOpenChange={() => setViewDetailsEvent(null)}>
                <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl sm:text-2xl pr-8">{viewDetailsEvent?.name}</DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                            {viewDetailsEvent && format(new Date(Number(viewDetailsEvent.date) / 1000000), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                        </DialogDescription>
                    </DialogHeader>
                    {viewDetailsEvent && (
                        <div className="space-y-4 sm:space-y-6">
                            <Badge variant="secondary">Archived Event</Badge>

                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                <div>
                                    <h4 className="mb-2 text-xs sm:text-sm font-semibold text-muted-foreground">Client</h4>
                                    <p className="font-medium text-sm sm:text-base">{getClientName(viewDetailsEvent.clientId)}</p>
                                </div>
                                <div>
                                    <h4 className="mb-2 text-xs sm:text-sm font-semibold text-muted-foreground">Venue</h4>
                                    <p className="font-medium text-sm sm:text-base">{getVenueName(viewDetailsEvent.venue)}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="mb-2 text-xs sm:text-sm font-semibold text-muted-foreground">Guest Count</h4>
                                <p className="font-medium text-sm sm:text-base">{viewDetailsEvent.guestCount.toString()} guests</p>
                            </div>

                            {viewDetailsEvent.staffAssignments.length > 0 && (
                                <div>
                                    <h4 className="mb-3 text-xs sm:text-sm font-semibold text-muted-foreground">Assigned Staff</h4>
                                    <div className="space-y-2">
                                        {getStaffNames(viewDetailsEvent.staffAssignments).map((info, idx) => (
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

                            {viewDetailsEvent.menuDetails.length > 0 && (
                                <div>
                                    <h4 className="mb-3 text-xs sm:text-sm font-semibold text-muted-foreground">Menu Details</h4>
                                    <div className="space-y-3">
                                        {viewDetailsEvent.menuDetails.map((menuDetail, idx) => (
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

                            {viewDetailsEvent.specialRequests && (
                                <div>
                                    <h4 className="mb-2 text-xs sm:text-sm font-semibold text-muted-foreground">Special Requests</h4>
                                    <p className="text-xs sm:text-sm break-words">{viewDetailsEvent.specialRequests}</p>
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
                                                ${viewDetailsEvent.paymentDetails.downPaymentAmount.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox 
                                                checked={viewDetailsEvent.paymentDetails.isDownPaymentMade}
                                                disabled
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {viewDetailsEvent.paymentDetails.isDownPaymentMade ? 'Paid' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Full Payment</p>
                                            <p className="text-lg font-bold">
                                                ${viewDetailsEvent.paymentDetails.fullPaymentAmount.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox 
                                                checked={viewDetailsEvent.paymentDetails.isFullPaymentMade}
                                                disabled
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {viewDetailsEvent.paymentDetails.isFullPaymentMade ? 'Paid' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold text-muted-foreground">Event Details</h4>
                                <div className="space-y-2 sm:space-y-3">
                                    {viewDetailsEvent.details.map((detail, index) => (
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
        </>
    );
}
