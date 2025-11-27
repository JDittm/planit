import { Calendar, Menu, LayoutDashboard, Users, MapPin, UserCog, Package, FileText, Archive, User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface HeaderProps {
    onNavigate?: (tab: string) => void;
    onCalendarClick?: () => void;
}

export default function Header({ onNavigate, onCalendarClick }: HeaderProps) {
    const handleNavigation = (tab: string) => {
        if (onNavigate) {
            onNavigate(tab);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary via-primary/80 to-secondary bg-clip-text text-transparent">
                        Plan.it
                    </h1>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCalendarClick}
                        className="h-9 w-9"
                        title="Calendar"
                    >
                        <Calendar className="h-5 w-5" />
                    </Button>
                    
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleNavigation('overview')}
                        className="h-9 w-9"
                        title="Overview"
                    >
                        <LayoutDashboard className="h-5 w-5" />
                    </Button>
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => handleNavigation('clients')}>
                                <Users className="mr-2 h-4 w-4" />
                                Clients
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleNavigation('venues')}>
                                <MapPin className="mr-2 h-4 w-4" />
                                Venues
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleNavigation('staff')}>
                                <UserCog className="mr-2 h-4 w-4" />
                                Staff
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleNavigation('inventory')}>
                                <Package className="mr-2 h-4 w-4" />
                                Inventory
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleNavigation('templates')}>
                                <FileText className="mr-2 h-4 w-4" />
                                Templates
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleNavigation('archive')}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleNavigation('profile')}>
                                <User className="mr-2 h-4 w-4" />
                                Profile
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
