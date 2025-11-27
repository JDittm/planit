import { useState, useMemo } from 'react';
import { Mail, Phone, MapPin, Search, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { useGetAllClients, useDeleteClient } from '@/hooks/useQueries';
import EditClientDialog from './EditClientDialog';
import type { Client } from '@/backend';

export default function ClientList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

    const { data: allClients = [], isLoading } = useGetAllClients();
    const deleteClient = useDeleteClient();

    // Client-side filtering for better performance
    const clients = useMemo(() => {
        if (!searchTerm.trim()) return allClients;
        
        const lowerSearch = searchTerm.toLowerCase();
        return allClients.filter(client =>
            client.firstName.toLowerCase().includes(lowerSearch) ||
            client.lastName.toLowerCase().includes(lowerSearch) ||
            client.phoneNumber.toLowerCase().includes(lowerSearch) ||
            client.email.toLowerCase().includes(lowerSearch) ||
            client.address.toLowerCase().includes(lowerSearch)
        );
    }, [allClients, searchTerm]);

    const handleDelete = async () => {
        if (!clientToDelete) return;

        try {
            await deleteClient.mutateAsync(clientToDelete.id);
            toast.success('Client deleted successfully');
            setClientToDelete(null);
        } catch (error) {
            toast.error('Failed to delete client');
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full max-w-md" />
                <Card>
                    <CardContent className="p-0">
                        <div className="space-y-2 p-4">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-3 sm:px-0">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 text-sm"
                    />
                </div>
            </div>

            {clients.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Mail className="mb-4 h-12 w-12 text-muted-foreground" />
                        <h3 className="mb-2 text-lg font-semibold">
                            {searchTerm ? 'No Clients Found' : 'No Clients Yet'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {searchTerm
                                ? 'Try adjusting your search terms'
                                : 'Add your first client to start managing events'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <ScrollArea className="w-full">
                            <div className="min-w-[800px]">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="font-semibold text-xs sm:text-sm">First Name</TableHead>
                                            <TableHead className="font-semibold text-xs sm:text-sm">Last Name</TableHead>
                                            <TableHead className="font-semibold text-xs sm:text-sm">Phone Number</TableHead>
                                            <TableHead className="font-semibold text-xs sm:text-sm">Email</TableHead>
                                            <TableHead className="font-semibold text-xs sm:text-sm">Address</TableHead>
                                            <TableHead className="text-right font-semibold text-xs sm:text-sm">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {clients.map((client) => (
                                            <TableRow key={client.id} className="hover:bg-muted/50">
                                                <TableCell className="font-medium text-xs sm:text-sm">{client.firstName}</TableCell>
                                                <TableCell className="font-medium text-xs sm:text-sm">{client.lastName}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                                        <span className="text-xs sm:text-sm">{client.phoneNumber}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {client.email ? (
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                                            <span className="truncate max-w-[200px] text-xs sm:text-sm">{client.email}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs sm:text-sm">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {client.address ? (
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                                                            <span className="truncate max-w-[250px] text-xs sm:text-sm">{client.address}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs sm:text-sm">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setClientToEdit(client)}
                                                        >
                                                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setClientToDelete(client)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}

            <AlertDialog open={!!clientToDelete} onOpenChange={() => setClientToDelete(null)}>
                <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Client</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {clientToDelete?.firstName} {clientToDelete?.lastName}? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel disabled={deleteClient.isPending} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteClient.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                        >
                            {deleteClient.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {clientToEdit && (
                <EditClientDialog
                    client={clientToEdit}
                    open={!!clientToEdit}
                    onOpenChange={(open) => !open && setClientToEdit(null)}
                />
            )}
        </div>
    );
}
