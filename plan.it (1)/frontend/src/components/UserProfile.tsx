import { useState } from 'react';
import { Trash2, Loader2, Settings, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useDeleteAllData, useGetDailyEventLimit, useSetDailyEventLimit } from '@/hooks/useQueries';
import UserSettingsDialog from './UserSettingsDialog';
import UserManagement from './UserManagement';
import StaffingRulesManagement from './StaffingRulesManagement';
import EventAddOnsManagement from './EventAddOnsManagement';
import VenueServicesManagement from './VenueServicesManagement';
import { useTheme } from './ThemeProvider';

export default function UserProfile() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [dailyLimit, setDailyLimit] = useState('');
    const { data: currentLimit } = useGetDailyEventLimit();
    const setLimit = useSetDailyEventLimit();
    const deleteAllData = useDeleteAllData();
    const { theme, setTheme } = useTheme();

    const themes = [
        { value: 'purple-light' as const, label: 'Purple Light', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
        { value: 'warm-sunset' as const, label: 'Warm Sunset', color: 'bg-gradient-to-r from-orange-500 to-red-500' },
        { value: 'cool-ocean' as const, label: 'Cool Ocean', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    ];

    const handleDeleteAllData = async () => {
        try {
            await deleteAllData.mutateAsync();
            toast.success('All data deleted successfully');
        } catch (error) {
            toast.error('Failed to delete data');
            console.error(error);
        }
    };

    const handleSetDailyLimit = async () => {
        const limit = parseInt(dailyLimit);
        if (!limit || limit < 1) {
            toast.error('Please enter a valid number (minimum 1)');
            return;
        }

        try {
            await setLimit.mutateAsync(BigInt(limit));
            toast.success(`Daily event limit set to ${limit}`);
            setDailyLimit('');
        } catch (error) {
            toast.error('Failed to set daily event limit');
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Profile & Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your preferences and application settings
                    </p>
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Palette className="h-4 w-4" />
                                <span className="hidden sm:inline">Theme</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Color Scheme</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {themes.map((t) => (
                                <DropdownMenuItem
                                    key={t.value}
                                    onClick={() => setTheme(t.value)}
                                    className="flex items-center gap-3 cursor-pointer"
                                >
                                    <div className={`h-4 w-4 rounded-full ${t.color}`} />
                                    <span>{t.label}</span>
                                    {theme === t.value && (
                                        <span className="ml-auto text-xs">✓</span>
                                    )}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={() => setIsSettingsOpen(true)} variant="outline">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daily Event Limit</CardTitle>
                    <CardDescription>
                        Set the maximum number of events that can be booked per day
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="daily-limit">Maximum events per day</Label>
                            <Input
                                id="daily-limit"
                                type="number"
                                min="1"
                                placeholder={currentLimit ? `Current: ${currentLimit}` : 'Enter limit'}
                                value={dailyLimit}
                                onChange={(e) => setDailyLimit(e.target.value)}
                                disabled={setLimit.isPending}
                            />
                        </div>
                        <Button
                            onClick={handleSetDailyLimit}
                            disabled={setLimit.isPending || !dailyLimit}
                            className="mt-8"
                        >
                            {setLimit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Set Limit
                        </Button>
                    </div>
                    {currentLimit && (
                        <p className="text-sm text-muted-foreground">
                            Current limit: <span className="font-semibold">{currentLimit.toString()}</span> events per day
                        </p>
                    )}
                </CardContent>
            </Card>

            <Separator />

            <UserManagement />

            <Separator />

            <EventAddOnsManagement />

            <Separator />

            <StaffingRulesManagement />

            <Separator />

            <VenueServicesManagement />

            <Separator />

            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>
                        Irreversible actions that will permanently delete your data
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={deleteAllData.isPending}>
                                {deleteAllData.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="mr-2 h-4 w-4" />
                                )}
                                Delete All Data
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete all your
                                    clients, events, and venues from the database.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteAllData}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Delete Everything
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>

            <UserSettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        </div>
    );
}
