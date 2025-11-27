import { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, Users, Building2, Mail, UserCog, Archive, AlertTriangle, ChevronDown, User, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ClientList from '@/components/ClientList';
import EventsOverview from '@/components/EventsOverview';
import VenueDirectory from '@/components/VenueDirectory';
import CalendarView from '@/components/CalendarView';
import EmailTemplates from '@/components/EmailTemplates';
import StaffManagement from '@/components/StaffManagement';
import UserProfile from '@/components/UserProfile';
import InventoryManagement from '@/components/InventoryManagement';
import CreateClientDialog from '@/components/CreateClientDialog';
import CreateEventDialog from '@/components/CreateEventDialog';
import ArchivedEvents from '@/components/ArchivedEvents';
import { useGetAllClients, useGetDashboardData, useGetEventsWithPendingDetails } from '@/hooks/useQueries';
import { format } from 'date-fns';

interface DashboardProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export default function Dashboard({ activeTab, onTabChange }: DashboardProps) {
    const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
    const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);

    const { data: clients = [], isLoading: clientsLoading } = useGetAllClients();
    const { data: dashboardData = [], isLoading: dashboardLoading } = useGetDashboardData();
    const { data: urgentEvents = [], isLoading: urgentLoading } = useGetEventsWithPendingDetails();

    const isLoading = clientsLoading || dashboardLoading || urgentLoading;

    const handleUrgentEventClick = (eventId: string) => {
        onTabChange('overview');
        setTimeout(() => {
            const element = document.getElementById(`event-${eventId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    return (
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
            {urgentEvents.length > 0 && (
                <div className="fixed top-16 sm:top-4 right-2 sm:right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1.5 sm:gap-2 rounded-lg border-2 border-destructive bg-destructive/90 px-2 sm:px-4 py-1.5 sm:py-2 shadow-lg backdrop-blur-sm hover:bg-destructive transition-colors">
                                <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive-foreground flex-shrink-0" />
                                <span className="text-xs sm:text-sm font-semibold text-destructive-foreground whitespace-nowrap">
                                    <span className="hidden sm:inline">Urgent: </span>
                                    {urgentEvents.length} event{urgentEvents.length !== 1 ? 's' : ''}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive-foreground flex-shrink-0" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-72 sm:w-80 max-h-[70vh] sm:max-h-96 overflow-y-auto">
                            {urgentEvents.map((event) => {
                                const client = dashboardData.find(([c]) => c.id === event.clientId)?.[0];
                                const eventDate = new Date(Number(event.date) / 1000000);
                                const pendingDetails = event.details.filter(d => !d.isConfirmed);
                                
                                return (
                                    <DropdownMenuItem
                                        key={event.id}
                                        className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                                        onClick={() => handleUrgentEventClick(event.id)}
                                    >
                                        <div className="font-semibold text-sm">{event.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {format(eventDate, 'MMM d, yyyy')}
                                        </div>
                                        <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                            {pendingDetails.length} pending detail{pendingDetails.length !== 1 ? 's' : ''}
                                        </div>
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4 sm:space-y-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button 
                            onClick={() => setIsClientDialogOpen(true)} 
                            variant="outline" 
                            className="border-primary/50 hover:bg-primary/10 w-full sm:w-auto text-sm sm:text-base"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Client
                        </Button>
                        <Button 
                            onClick={() => setIsEventDialogOpen(true)} 
                            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 w-full sm:w-auto text-sm sm:text-base"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            New Event
                        </Button>
                    </div>
                </div>

                <TabsContent value="calendar" className="space-y-6 mt-0">
                    <CalendarView />
                </TabsContent>

                <TabsContent value="overview" className="space-y-6 mt-0">
                    <EventsOverview
                        dashboardData={dashboardData}
                        urgentEvents={urgentEvents}
                        isLoading={isLoading}
                    />
                </TabsContent>

                <TabsContent value="clients" className="space-y-6 mt-0">
                    <ClientList />
                </TabsContent>

                <TabsContent value="venues" className="space-y-6 mt-0">
                    <VenueDirectory />
                </TabsContent>

                <TabsContent value="staff" className="space-y-6 mt-0">
                    <StaffManagement />
                </TabsContent>

                <TabsContent value="inventory" className="space-y-6 mt-0">
                    <InventoryManagement />
                </TabsContent>

                <TabsContent value="templates" className="space-y-6 mt-0">
                    <EmailTemplates />
                </TabsContent>

                <TabsContent value="archive" className="space-y-6 mt-0">
                    <ArchivedEvents />
                </TabsContent>

                <TabsContent value="profile" className="space-y-6 mt-0">
                    <UserProfile />
                </TabsContent>
            </Tabs>

            <CreateClientDialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen} />
            <CreateEventDialog
                open={isEventDialogOpen}
                onOpenChange={setIsEventDialogOpen}
                clients={clients}
            />
        </div>
    );
}
