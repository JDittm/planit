import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useGetDashboardData, useGetAllVenues, useGetAllStaff, useDeleteEvent } from '@/hooks/useQueries';
import { Event, Client } from '@/backend';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { CalendarDays, MapPin, User, CheckCircle2, AlertCircle, Clock, Users, Trash2, Loader2, ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import { toast } from 'sonner';
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
import EditEventDialog from './EditEventDialog';

export default function CalendarView() {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedEvent, setSelectedEvent] = useState<{ event: Event; client: Client } | null>(null);
    const [editingEvent, setEditingEvent] = useState<{ event: Event; client: Client } | null>(null);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);
    
    const { data: dashboardData = [], isLoading } = useGetDashboardData();
    const { data: venues = [] } = useGetAllVenues();
    const { data: staff = [] } = useGetAllStaff();
    const deleteEvent = useDeleteEvent();

    const allEvents = dashboardData.flatMap(([client, events]) =>
        events.filter(event => !event.isArchived).map(event => ({ event, client }))
    );

    const eventsOnSelectedDate = selectedDate
        ? allEvents.filter(({ event }) => {
              const eventDate = new Date(Number(event.date) / 1000000);
              return isSameDay(eventDate, selectedDate);
          })
        : [];

    const getVenueName = (venueId: string) => {
        const venue = venues.find(v => v.id === venueId);
        return venue?.name || venueId;
    };

    const getCompletionStatus = (event: Event) => {
        const confirmedCount = event.details.filter(d => d.isConfirmed).length;
        const totalCount = event.details.length;
        return { confirmedCount, totalCount, percentage: totalCount > 0 ? (confirmedCount / totalCount) * 100 : 0 };
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

    const getEventsForDate = (date: Date) => {
        return allEvents.filter(({ event }) => {
            const eventDate = new Date(Number(event.date) / 1000000);
            return isSameDay(eventDate, date);
        });
    };

    const handleDeleteEvent = async () => {
        if (!eventToDelete) return;
        
        try {
            await deleteEvent.mutateAsync(eventToDelete);
            toast.success('Event deleted successfully');
            setEventToDelete(null);
            setSelectedEvent(null);
        } catch (error) {
            toast.error('Failed to delete event');
            console.error(error);
        }
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground">Loading calendar...</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Responsive Calendar Card */}
            <Card className="w-full shadow-xl border-2">
                <CardHeader className="text-center pb-2 sm:pb-3 px-3 sm:px-6">
                    <CardTitle className="flex items-center justify-center gap-2 text-xl sm:text-2xl font-bold">
                        <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        Event Calendar
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                        View and manage your scheduled events
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-4 pb-4 sm:pb-6">
                    {/* Month Navigation - responsive */}
                    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-5">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={previousMonth}
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-primary/10 hover:border-primary transition-all"
                        >
                            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                        <h2 className="text-lg sm:text-2xl font-bold tracking-tight min-w-[180px] sm:min-w-[240px] text-center">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h2>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={nextMonth}
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full hover:bg-primary/10 hover:border-primary transition-all"
                        >
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </div>

                    {/* Calendar Grid - fully responsive */}
                    <div className="w-full max-w-6xl mx-auto">
                        {/* Day Headers - responsive text */}
                        <div className="grid grid-cols-7 gap-0.5 sm:gap-1.5 mb-2 sm:mb-3">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                <div
                                    key={day}
                                    className="text-center font-bold text-[10px] sm:text-sm text-muted-foreground py-1 sm:py-2 uppercase tracking-wider"
                                >
                                    <span className="hidden sm:inline">{day}</span>
                                    <span className="sm:hidden">{day.charAt(0)}</span>
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days - responsive sizing */}
                        <div className="grid grid-cols-7 gap-0.5 sm:gap-1.5">
                            {calendarDays.map((day) => {
                                const dayEvents = getEventsForDate(day);
                                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                                const isToday = isSameDay(day, new Date());
                                const isSelected = selectedDate && isSameDay(day, selectedDate);
                                const clientLastNames = dayEvents.slice(0, 3).map(({ client }) => client.lastName);

                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => setSelectedDate(day)}
                                        className={`
                                            min-h-[60px] sm:min-h-[90px] md:min-h-[110px] p-1 sm:p-2 rounded-md sm:rounded-lg border sm:border-2 transition-all duration-200
                                            flex flex-col items-center justify-start
                                            ${isCurrentMonth ? 'bg-card hover:bg-accent/20' : 'bg-muted/30 opacity-50'}
                                            ${isToday ? 'border-accent shadow-md' : 'border-border'}
                                            ${isSelected ? 'border-primary bg-primary/10 shadow-lg' : ''}
                                            ${dayEvents.length > 0 ? 'hover:shadow-xl hover:border-primary/50' : 'hover:border-primary/30'}
                                        `}
                                    >
                                        <span className={`
                                            text-xs sm:text-base font-bold mb-1 sm:mb-2 w-full text-center
                                            ${isToday ? 'text-accent' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
                                        `}>
                                            {format(day, 'd')}
                                        </span>
                                        
                                        {clientLastNames.length > 0 && (
                                            <div className="w-full space-y-0.5 sm:space-y-1 flex flex-col items-center">
                                                {clientLastNames.map((lastName, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-[8px] sm:text-[11px] font-semibold bg-primary/15 hover:bg-primary/25 px-1 sm:px-2 py-0.5 sm:py-1 rounded sm:rounded-md transition-colors border border-primary/40 shadow-sm w-[95%] text-center"
                                                        title={lastName}
                                                    >
                                                        <span className="block truncate">{lastName}</span>
                                                    </div>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <div className="text-[7px] sm:text-[9px] text-muted-foreground font-medium mt-0.5">
                                                        +{dayEvents.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Selected Date Events - responsive grid */}
            <Card className="w-full shadow-lg">
                <CardHeader className="px-3 sm:px-6">
                    <CardTitle className="text-lg sm:text-2xl flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                        <span className="truncate">{selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}</span>
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                        {eventsOnSelectedDate.length} event{eventsOnSelectedDate.length !== 1 ? 's' : ''} scheduled for this day
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                    {eventsOnSelectedDate.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center text-muted-foreground">
                            <CalendarDays className="mb-3 sm:mb-5 h-12 sm:h-20 w-12 sm:w-20 opacity-20" />
                            <p className="text-lg sm:text-xl font-medium">No events scheduled</p>
                            <p className="text-sm sm:text-base mt-2 sm:mt-3">Select a different date to view events</p>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                            {eventsOnSelectedDate.map(({ event, client }) => {
                                const status = getCompletionStatus(event);
                                const eventDateTime = new Date(Number(event.date) / 1000000);
                                return (
                                    <Card
                                        key={event.id}
                                        className="cursor-pointer transition-all hover:shadow-xl hover:border-primary/60 hover:scale-[1.02] sm:hover:scale-[1.03] duration-200"
                                        onClick={() => setSelectedEvent({ event, client })}
                                    >
                                        <CardContent className="p-4 sm:p-6">
                                            <div className="space-y-3 sm:space-y-4">
                                                <div className="flex items-start justify-between gap-2 sm:gap-3">
                                                    <h3 className="font-semibold text-base sm:text-lg leading-tight">{event.name}</h3>
                                                    {status.percentage === 100 ? (
                                                        <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-green-600" />
                                                    ) : (
                                                        <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-amber-600" />
                                                    )}
                                                </div>
                                                <div className="space-y-2 sm:space-y-2.5">
                                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                                        <span>{format(eventDateTime, 'h:mm a')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                                        <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                                        <span className="truncate font-medium">{client.firstName} {client.lastName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                                        <span className="truncate">{getVenueName(event.venue)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                                        <span>{event.guestCount.toString()} guests</span>
                                                    </div>
                                                </div>
                                                <Badge variant={status.percentage === 100 ? 'default' : 'secondary'} className="mt-2 sm:mt-3 text-xs">
                                                    {status.confirmedCount}/{status.totalCount} Details Complete
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Event Details Dialog - responsive */}
            <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
                <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
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
                                    <h4 className="mb-2 text-xs sm:text-sm font-semibold text-muted-foreground">Event Type</h4>
                                    <p className="font-medium text-sm sm:text-base">{selectedEvent.event.name}</p>
                                </div>
                                <div>
                                    <h4 className="mb-2 text-xs sm:text-sm font-semibold text-muted-foreground">Client</h4>
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm sm:text-base">{selectedEvent.client.firstName} {selectedEvent.client.lastName}</p>
                                        <p className="text-xs sm:text-sm text-muted-foreground break-all">{selectedEvent.client.email}</p>
                                        <p className="text-xs sm:text-sm text-muted-foreground">{selectedEvent.client.phoneNumber}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                                <div>
                                    <h4 className="mb-2 text-xs sm:text-sm font-semibold text-muted-foreground">Venue</h4>
                                    <p className="font-medium text-sm sm:text-base">{getVenueName(selectedEvent.event.venue)}</p>
                                </div>
                                <div>
                                    <h4 className="mb-2 text-xs sm:text-sm font-semibold text-muted-foreground">Guest Count</h4>
                                    <p className="font-medium text-sm sm:text-base">{selectedEvent.event.guestCount.toString()} guests</p>
                                </div>
                            </div>

                            {selectedEvent.event.staffAssignments.length > 0 && (
                                <div>
                                    <h4 className="mb-2 text-xs sm:text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        Assigned Staff
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {getStaffInfo(selectedEvent.event.staffAssignments).map((info, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs">
                                                {info.name} {info.position && `(${info.position})`}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedEvent.event.menuDetails.length > 0 && (
                                <div>
                                    <h4 className="mb-3 text-xs sm:text-sm font-semibold text-muted-foreground">Menu Details</h4>
                                    <div className="space-y-2 sm:space-y-3">
                                        {selectedEvent.event.menuDetails.map((menuDetail, idx) => (
                                            <div key={idx} className="rounded-lg border p-2 sm:p-3 space-y-2">
                                                <h5 className="font-semibold text-xs sm:text-sm">{menuDetail.category}</h5>
                                                {menuDetail.items.map((item, itemIdx) => (
                                                    <div key={itemIdx} className="space-y-1.5 pl-2 sm:pl-3">
                                                        <p className="font-medium text-xs sm:text-sm">{item.name}</p>
                                                        {item.details.length > 0 && (
                                                            <div className="space-y-1">
                                                                {item.details.map((detail, detailIdx) => (
                                                                    detail && (
                                                                        <p key={detailIdx} className="text-xs sm:text-sm text-muted-foreground pl-2 sm:pl-3 border-l-2 border-muted">
                                                                            {detail}
                                                                        </p>
                                                                    )
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedEvent.event.specialRequests && (
                                <div>
                                    <h4 className="mb-2 text-xs sm:text-sm font-semibold text-muted-foreground">Special Requests</h4>
                                    <p className="text-xs sm:text-sm">{selectedEvent.event.specialRequests}</p>
                                </div>
                            )}

                            <Separator />

                            <div>
                                <h4 className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold text-muted-foreground">Event Details</h4>
                                <div className="space-y-2 sm:space-y-3">
                                    {selectedEvent.event.details.map((detail, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-2 sm:gap-3 rounded-lg border p-2 sm:p-3"
                                        >
                                            {detail.isConfirmed ? (
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-green-600" />
                                            ) : (
                                                <AlertCircle className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-amber-600" />
                                            )}
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

                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setEditingEvent(selectedEvent);
                                        setSelectedEvent(null);
                                    }}
                                    className="w-full sm:w-auto text-sm"
                                >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Event
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setEventToDelete(selectedEvent.event.id)}
                                    disabled={deleteEvent.isPending}
                                    className="w-full sm:w-auto text-sm"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Event
                                </Button>
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
        </div>
    );
}
