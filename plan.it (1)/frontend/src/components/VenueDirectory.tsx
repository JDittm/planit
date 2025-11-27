import { useState } from 'react';
import { Building2, MapPin, Phone, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useGetAllVenues, useDeleteVenue, useGetAllVenueServices } from '@/hooks/useQueries';
import CreateVenueDialog from './CreateVenueDialog';
import EditVenueDialog from './EditVenueDialog';
import UserSettingsDialog from './UserSettingsDialog';
import DistanceDisplay from './DistanceDisplay';
import type { Venue } from '@/backend';

export default function VenueDirectory() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [venueToEdit, setVenueToEdit] = useState<Venue | null>(null);
    const [venueToDelete, setVenueToDelete] = useState<Venue | null>(null);

    const { data: venues = [], isLoading } = useGetAllVenues();
    const { data: allServices = [] } = useGetAllVenueServices();
    const deleteVenue = useDeleteVenue();

    const getServiceNameById = (serviceId: string): string => {
        const service = allServices.find(s => s.id === serviceId);
        return service ? service.name : serviceId;
    };

    const handleDelete = async () => {
        if (!venueToDelete) return;

        try {
            await deleteVenue.mutateAsync(venueToDelete.id);
            toast.success('Venue deleted successfully');
            setVenueToDelete(null);
        } catch (error) {
            toast.error('Failed to delete venue');
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center px-3 sm:px-0">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {[...Array(8)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-5 w-3/4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-3 w-full mb-2" />
                                <Skeleton className="h-3 w-full mb-2" />
                                <Skeleton className="h-3 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-3 sm:px-0">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Venue Directory</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Manage your catering venues and their facilities
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <UserSettingsDialog />
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="flex-1 sm:flex-none text-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Venue
                    </Button>
                </div>
            </div>

            {venues.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">No Venues Yet</h3>
                        <p className="text-sm text-muted-foreground">
                            Add your first venue to start organizing events
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {venues.map((venue) => (
                        <Card key={venue.id} className="transition-shadow hover:shadow-md">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <CardTitle className="text-sm font-semibold line-clamp-1">{venue.name}</CardTitle>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => setVenueToEdit(venue)}
                                        >
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => setVenueToDelete(venue)}
                                        >
                                            <Trash2 className="h-3 w-3 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 text-xs">
                                <div className="flex items-start gap-1.5">
                                    <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                    <span className="line-clamp-2 text-muted-foreground">{venue.address}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Phone className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                                    <span className="text-muted-foreground">{venue.phone}</span>
                                </div>

                                <DistanceDisplay venueAddress={venue.address} className="pt-2 border-t text-xs" />

                                {venue.services.length > 0 && (
                                    <div className="pt-2 border-t">
                                        <p className="text-xs font-medium mb-1.5">Services:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {venue.services.map((serviceId) => (
                                                <Badge key={serviceId} variant="secondary" className="text-[10px] px-1.5 py-0">
                                                    {getServiceNameById(serviceId)}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <CreateVenueDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />

            {venueToEdit && (
                <EditVenueDialog
                    venue={venueToEdit}
                    open={!!venueToEdit}
                    onOpenChange={(open) => !open && setVenueToEdit(null)}
                />
            )}

            <AlertDialog open={!!venueToDelete} onOpenChange={() => setVenueToDelete(null)}>
                <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Venue</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {venueToDelete?.name}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel disabled={deleteVenue.isPending} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteVenue.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                        >
                            {deleteVenue.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
