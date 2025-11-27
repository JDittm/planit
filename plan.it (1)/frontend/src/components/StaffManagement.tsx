import { useState } from 'react';
import { Plus, Edit, Trash2, Phone, User, Mail, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetAllStaff, useDeleteStaff } from '@/hooks/useQueries';
import { toast } from 'sonner';
import CreateStaffDialog from './CreateStaffDialog';
import EditStaffDialog from './EditStaffDialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import type { Staff } from '@/backend';
import { format } from 'date-fns';

export default function StaffManagement() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

    const { data: staff = [], isLoading, isError, error } = useGetAllStaff();
    const deleteStaff = useDeleteStaff();

    const handleDelete = async (id: string) => {
        try {
            await deleteStaff.mutateAsync(id);
            toast.success('Staff member deleted successfully');
        } catch (error) {
            toast.error('Failed to delete staff member');
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Loading staff...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-destructive mb-4">
                        <p className="font-semibold">Error loading staff</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {error instanceof Error ? error.message : 'An unknown error occurred'}
                        </p>
                    </div>
                    <Button onClick={() => window.location.reload()}>
                        Reload Page
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Staff Management</h2>
                    <p className="text-muted-foreground">
                        Manage your team members and assign them to events
                    </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Staff Member
                </Button>
            </div>

            {staff.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <User className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
                        <h3 className="mb-2 text-lg font-semibold">No staff members yet</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Add your first staff member to get started
                        </p>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Staff Member
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {staff.map((staffMember) => (
                        <Card key={staffMember.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
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
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingStaff(staffMember)}
                                            disabled={deleteStaff.isPending}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm" disabled={deleteStaff.isPending}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete {staffMember.firstName} {staffMember.lastName}? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDelete(staffMember.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="h-4 w-4" />
                                        {staffMember.phoneNumber}
                                    </div>
                                    {staffMember.email && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="h-4 w-4" />
                                            {staffMember.email}
                                        </div>
                                    )}
                                    {staffMember.joinedDate > 0 && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            Joined {format(new Date(Number(staffMember.joinedDate) / 1000000), 'MMM d, yyyy')}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <CreateStaffDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
            {editingStaff && (
                <EditStaffDialog
                    staff={editingStaff}
                    open={!!editingStaff}
                    onOpenChange={(open) => !open && setEditingStaff(null)}
                />
            )}
        </div>
    );
}
