import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TimePickerProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export default function TimePicker({ value, onChange, disabled, placeholder = 'Select time', className }: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const hourScrollRef = useRef<HTMLDivElement>(null);
    const minuteScrollRef = useRef<HTMLDivElement>(null);

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

    const [selectedHour, selectedMinute] = value ? value.split(':').map(Number) : [null, null];

    useEffect(() => {
        if (isOpen && selectedHour !== null && hourScrollRef.current) {
            const selectedElement = hourScrollRef.current.querySelector(`[data-hour="${selectedHour}"]`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'center', behavior: 'instant' });
            }
        }
        if (isOpen && selectedMinute !== null && minuteScrollRef.current) {
            const selectedElement = minuteScrollRef.current.querySelector(`[data-minute="${selectedMinute}"]`);
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'center', behavior: 'instant' });
            }
        }
    }, [isOpen, selectedHour, selectedMinute]);

    const handleHourSelect = (hour: number) => {
        const minute = selectedMinute ?? 0;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        onChange(timeString);
    };

    const handleMinuteSelect = (minute: number) => {
        const hour = selectedHour ?? 0;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        onChange(timeString);
        setIsOpen(false);
    };

    const handleScroll = (e: React.WheelEvent<HTMLDivElement>, ref: React.RefObject<HTMLDivElement | null>) => {
        e.preventDefault();
        e.stopPropagation();
        if (ref.current) {
            ref.current.scrollTop += e.deltaY;
        }
    };

    const displayValue = value
        ? `${value.split(':')[0].padStart(2, '0')}:${value.split(':')[1].padStart(2, '0')}`
        : placeholder;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'w-full justify-start text-left font-normal h-11',
                        !value && 'text-muted-foreground',
                        className
                    )}
                >
                    <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{displayValue}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex divide-x bg-popover rounded-lg shadow-lg border">
                    <div 
                        ref={hourScrollRef}
                        className="h-[280px] overflow-y-auto scroll-smooth"
                        style={{ 
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'hsl(var(--primary)) hsl(var(--muted))'
                        }}
                        onWheel={(e) => handleScroll(e, hourScrollRef)}
                        onTouchMove={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col p-2 gap-1">
                            {hours.map((hour) => (
                                <Button
                                    key={hour}
                                    data-hour={hour}
                                    size="sm"
                                    variant={selectedHour === hour ? 'default' : 'ghost'}
                                    className={cn(
                                        "w-20 shrink-0 justify-center font-medium transition-all hover:bg-accent",
                                        selectedHour === hour && "shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                                    )}
                                    onClick={() => handleHourSelect(hour)}
                                >
                                    {hour.toString().padStart(2, '0')}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div 
                        ref={minuteScrollRef}
                        className="h-[280px] overflow-y-auto scroll-smooth"
                        style={{ 
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'hsl(var(--primary)) hsl(var(--muted))'
                        }}
                        onWheel={(e) => handleScroll(e, minuteScrollRef)}
                        onTouchMove={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col p-2 gap-1">
                            {minutes.map((minute) => (
                                <Button
                                    key={minute}
                                    data-minute={minute}
                                    size="sm"
                                    variant={selectedMinute === minute ? 'default' : 'ghost'}
                                    className={cn(
                                        "w-20 shrink-0 justify-center font-medium transition-all hover:bg-accent",
                                        selectedMinute === minute && "shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                                    )}
                                    onClick={() => handleMinuteSelect(minute)}
                                >
                                    {minute.toString().padStart(2, '0')}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
