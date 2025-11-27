import { useState } from 'react';
import { Plus, Trash2, Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useGetAllVenueServices, useCreateVenueService, useDeleteVenueService } from '@/hooks/useQueries';

export default function VenueServicesManagement() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [serviceName, setServiceName] = useState('');
    const [serviceToDelete, setServiceToDelete] = useState<{ id: string; name: string } | null>(null);

    const { data: services = [], isLoading } = useGetAllVenueServices();
    const createService = useCreateVenueService();
    const deleteService = useDeleteVenueService();

    const resetForm = () => {
        setServiceName('');
    };

    const handleCreateService = async () => {
        if (!serviceName.trim()) {
            toast.error('Please enter a service name');
            return;
        }

        const serviceId = `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            await createService.mutateAsync({
                id: serviceId,
                name: serviceName.trim()
            });
            toast.success('Service created successfully');
            resetForm();
            setIsCreateDialogOpen(false);
        } catch (error) {
            toast.error('Failed to create service');
            console.error(error);
        }
    };

    const handleDeleteService = async () => {
        if (!serviceToDelete) return;

        try {
            await deleteService.mutateAsync(serviceToDelete.id);
            toast.success('Service deleted successfully');
            setServiceToDelete(null);
        } catch (error) {
            toast.error('Failed to delete service');
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Venue Services</CardTitle>
                    <CardDescription>Loading services...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            <CardTitle>Venue Services</CardTitle>
                        </div>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Service
                        </Button>
                    </div>
                    <CardDescription>
                        Create services (e.g., Dumpster, Bar, Parking) that can be assigned to venues
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {services.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-sm">No services created yet. Add your first service to get started.</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {services.map((service) => (
                                <Badge key={service.id} variant="secondary" className="text-sm py-2 px-3 flex items-center gap-2">
                                    {service.name}
                                    <button
                                        onClick={() => setServiceToDelete(service)}
                                        className="ml-1 hover:text-destructive transition-colors"
                                        disabled={deleteService.isPending}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Service Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                setIsCreateDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Venue Service</DialogTitle>
                        <DialogDescription>
                            Create a new service that can be assigned to venues (e.g., Dumpster, Bar, Parking)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="service-name">Service Name *</Label>
                            <Input
                                id="service-name"
                                placeholder="e.g., Dumpster, Bar, Parking"
                                value={serviceName}
                                onChange={(e) => setServiceName(e.target.value)}
                                disabled={createService.isPending}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCreateDialogOpen(false)}
                            disabled={createService.isPending}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleCreateService} disabled={createService.isPending}>
                            {createService.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Service
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Service</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{serviceToDelete?.name}"? This will remove it from all venues that use it. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteService.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteService}
                            disabled={deleteService.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteService.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
