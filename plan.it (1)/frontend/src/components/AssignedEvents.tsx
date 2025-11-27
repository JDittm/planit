import { format } from 'date-fns';
import { Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetDashboardData, useGetAllStaff } from '@/hooks/useQueries';

export default function AssignedEvents() {
    const { data: dashboardData = [], isLoading: dashboardLoading } = useGetDashboardData();
    const { data: staff = [], isLoading: staffLoading } = useGetAllStaff();

    const isLoading = dashboardLoading || staffLoading;

    const allEvents = dashboardData.flatMap(([client, events]) =>
        events.map(event => ({ event, client }))
    );

    const staffAssignments = staff.map(staffMember => {
        const assignments = allEvents
            .filter(({ event }) => 
                event.staffAssignments.some(a => a.staffId === staffMember.id)
            )
            .map(({ event, client }) => {
                const assignment = event.staffAssignments.find(a => a.staffId === staffMember.id);
                return {
                    clientLastName: client.lastName,
                    eventDate: event.date,
                    position: assignment?.position || '',
                    eventName: event.name
                };
            })
            .sort((a, b) => Number(a.eventDate - b.eventDate));

        return {
            staff: staffMember,
            assignments
        };
    }).filter(item => item.assignments.length > 0);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Assigned Events</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (staffAssignments.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Assigned Events
                    </CardTitle>
                    <CardDescription>
                        View all staff members currently assigned to events
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Users className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
                        <h3 className="mb-2 text-lg font-semibold">No Staff Assignments</h3>
                        <p className="text-sm text-muted-foreground">
                            Assign staff members to events to see them here
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Assigned Events</h2>
                <p className="text-muted-foreground">
                    Staff members currently assigned to events
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {staffAssignments.map(({ staff: staffMember, assignments }) => (
                    <Card key={staffMember.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                    <Users className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <CardTitle className="text-lg">{staffMember.firstName} {staffMember.lastName}</CardTitle>
                                    {staffMember.positions.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {staffMember.positions.map((pos) => (
                                                <Badge key={pos} variant="secondary" className="text-xs">
                                                    {pos}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {assignments.map((assignment, idx) => (
                                    <div key={idx} className="rounded-lg border p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-sm">{assignment.clientLastName}</span>
                                            {assignment.position && (
                                                <Badge variant="outline" className="text-xs">
                                                    {assignment.position}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(Number(assignment.eventDate) / 1000000), 'MMM d, yyyy')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
