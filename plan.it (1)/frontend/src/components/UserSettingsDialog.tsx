import { useState, useEffect } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getUserSettings, saveUserSettings, type UserSettings } from '@/lib/userSettings';
import { saveGoogleMapsApiKey, getStoredGoogleMapsApiKey } from '@/lib/distanceCalculator';
import AddressAutocomplete from './AddressAutocomplete';

interface UserSettingsDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function UserSettingsDialog({ open: controlledOpen, onOpenChange }: UserSettingsDialogProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [userAddress, setUserAddress] = useState('');
    const [costPerMile, setCostPerMile] = useState('');
    const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

    useEffect(() => {
        if (open) {
            const settings = getUserSettings();
            setUserAddress(settings.userAddress);
            setCostPerMile(settings.costPerMile.toString());
            
            const storedApiKey = getStoredGoogleMapsApiKey();
            setGoogleMapsApiKey(storedApiKey || '');
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        if (!userAddress.trim()) {
            toast.error('Please enter your address');
            setIsSaving(false);
            return;
        }

        const cost = parseFloat(costPerMile);
        if (isNaN(cost) || cost < 0) {
            toast.error('Please enter a valid cost per mile');
            setIsSaving(false);
            return;
        }

        if (!googleMapsApiKey.trim()) {
            toast.error('Please enter your Google Maps API key');
            setIsSaving(false);
            return;
        }

        try {
            // Save user settings
            const settings: UserSettings = {
                userAddress: userAddress.trim(),
                costPerMile: cost
            };
            saveUserSettings(settings);

            // Save Google Maps API key
            saveGoogleMapsApiKey(googleMapsApiKey.trim());

            toast.success('Settings saved successfully');
            setOpen(false);
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Travel Settings</DialogTitle>
                        <DialogDescription>
                            Configure your address, travel cost, and Google Maps API key for distance calculations
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="google-maps-api-key">Google Maps API Key *</Label>
                            <Input
                                id="google-maps-api-key"
                                type="text"
                                placeholder="Enter your Google Maps API key"
                                value={googleMapsApiKey}
                                onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                                disabled={isSaving}
                            />
                            <p className="text-xs text-muted-foreground">
                                Get your API key from{' '}
                                <a
                                    href="https://developers.google.com/maps/documentation/distance-matrix/get-api-key"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                    Google Cloud Console
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="user-address">Your Address *</Label>
                            <AddressAutocomplete
                                id="user-address"
                                value={userAddress}
                                onChange={setUserAddress}
                                placeholder="Start typing your address..."
                                disabled={isSaving}
                            />
                            <p className="text-xs text-muted-foreground">
                                This address will be used to calculate travel distance to venues
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cost-per-mile">Cost Per Mile ($) *</Label>
                            <Input
                                id="cost-per-mile"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.67"
                                value={costPerMile}
                                onChange={(e) => setCostPerMile(e.target.value)}
                                disabled={isSaving}
                            />
                            <p className="text-xs text-muted-foreground">
                                Standard IRS mileage rate for 2025 is $0.67 per mile
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Settings
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
