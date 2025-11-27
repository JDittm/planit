import { useState, useEffect } from 'react';
import { MapPin, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { calculateDistanceAndCost } from '@/lib/distanceCalculator';
import { getUserSettings } from '@/lib/userSettings';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DistanceDisplayProps {
    venueAddress: string;
    className?: string;
}

export default function DistanceDisplay({ venueAddress, className = '' }: DistanceDisplayProps) {
    const [distance, setDistance] = useState<number | null>(null);
    const [cost, setCost] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const calculateDistance = async () => {
            const settings = getUserSettings();
            
            if (!settings.userAddress || settings.userAddress.trim() === '') {
                setError('Please set your address in Travel Settings to calculate distances');
                return;
            }

            if (!venueAddress || venueAddress.trim() === '') {
                setError('Venue address is missing');
                return;
            }

            setIsLoading(true);
            setError(null);
            setDistance(null);
            setCost(null);

            try {
                const result = await calculateDistanceAndCost(
                    settings.userAddress,
                    venueAddress,
                    settings.costPerMile
                );

                if (result) {
                    setDistance(result.distance);
                    setCost(result.roundTripCost);
                } else {
                    setError('Unable to calculate distance. Please check your settings and try again.');
                }
            } catch (err: any) {
                console.error('Distance calculation failed:', err);
                const errorMessage = err?.message || 'Failed to calculate distance';
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        calculateDistance();
    }, [venueAddress]);

    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Calculating distance...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className={className}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                    {error}
                </AlertDescription>
            </Alert>
        );
    }

    if (distance === null || cost === null) {
        return null;
    }

    return (
        <div className={`flex flex-wrap items-center gap-2 ${className}`}>
            <Badge variant="outline" className="text-xs font-medium">
                <MapPin className="mr-1 h-3 w-3" />
                {distance} mi (round-trip)
            </Badge>
            <Badge variant="outline" className="text-xs font-medium">
                <DollarSign className="mr-1 h-3 w-3" />
                ${cost.toFixed(2)} travel cost
            </Badge>
        </div>
    );
}
