import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Client, Event, EventDetail, Venue, EmailTemplate, Staff, StaffAssignment, MenuDetail, EventPosition, MenuCategory, AddOn, StaffingRule, InventoryItem, PositionRequirement, ExtraCondition, VenueService } from '@/backend';

export function useGetAllClients() {
    const { actor, isFetching } = useActor();

    return useQuery<Client[]>({
        queryKey: ['clients'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getAllClients();
        },
        enabled: !!actor && !isFetching
    });
}

export function useSearchClients(searchTerm: string) {
    const { actor, isFetching } = useActor();

    return useQuery<Client[]>({
        queryKey: ['clients', 'search', searchTerm],
        queryFn: async () => {
            if (!actor) return [];
            if (!searchTerm.trim()) {
                return actor.getAllClients();
            }
            return actor.searchClients(searchTerm);
        },
        enabled: !!actor && !isFetching
    });
}

export function useGetDashboardData() {
    const { actor, isFetching } = useActor();

    return useQuery<Array<[Client, Event[]]>>({
        queryKey: ['dashboard'],
        queryFn: async () => {
            if (!actor) return [];
            const data = await actor.getDashboardData();
            await actor.archivePastEvents();
            return data;
        },
        enabled: !!actor && !isFetching,
        refetchInterval: 60000
    });
}

export function useGetArchivedEvents() {
    const { actor, isFetching } = useActor();

    return useQuery<Event[]>({
        queryKey: ['archived-events'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getArchivedEvents();
        },
        enabled: !!actor && !isFetching
    });
}

export function useGetEventsWithPendingDetails() {
    const { actor, isFetching } = useActor();

    return useQuery<Event[]>({
        queryKey: ['urgent-events'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getEventsWithPendingDetails();
        },
        enabled: !!actor && !isFetching
    });
}

export function useGetAllVenues() {
    const { actor, isFetching } = useActor();

    return useQuery<Venue[]>({
        queryKey: ['venues'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getAllVenues();
        },
        enabled: !!actor && !isFetching
    });
}

export function useGetAllEmailTemplates() {
    const { actor, isFetching } = useActor();

    return useQuery<EmailTemplate[]>({
        queryKey: ['email-templates'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getAllEmailTemplates();
        },
        enabled: !!actor && !isFetching
    });
}

export function useGetAllStaff() {
    const { actor, isFetching } = useActor();

    return useQuery<Staff[]>({
        queryKey: ['staff'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getAllStaff();
        },
        enabled: !!actor && !isFetching
    });
}

export function useGetAllMenuCategories() {
    const { actor, isFetching } = useActor();

    return useQuery<MenuCategory[]>({
        queryKey: ['menu-categories'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getAllMenuCategories();
        },
        enabled: !!actor && !isFetching
    });
}

export function useGetAllAddOns() {
    const { actor, isFetching } = useActor();

    return useQuery<AddOn[]>({
        queryKey: ['add-ons'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getAllAddOns();
        },
        enabled: !!actor && !isFetching
    });
}

export function useGetAllStaffingRules() {
    const { actor, isFetching } = useActor();

    return useQuery<StaffingRule[]>({
        queryKey: ['staffing-rules'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getAllStaffingRules();
        },
        enabled: !!actor && !isFetching
    });
}

export function useGetDailyEventLimit() {
    const { actor, isFetching } = useActor();

    return useQuery<bigint>({
        queryKey: ['daily-event-limit'],
        queryFn: async () => {
            if (!actor) return BigInt(3);
            return actor.getDailyEventLimit();
        },
        enabled: !!actor && !isFetching
    });
}

export function useGetAllVenueServices() {
    const { actor, isFetching } = useActor();

    return useQuery<VenueService[]>({
        queryKey: ['venue-services'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getAllVenueServices();
        },
        enabled: !!actor && !isFetching
    });
}

export function useGetAllInventoryItems() {
    const { actor, isFetching } = useActor();

    return useQuery<InventoryItem[]>({
        queryKey: ['inventory-items'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getAllInventoryItems();
        },
        enabled: !!actor && !isFetching
    });
}

export function useGetInventorySummary() {
    const { actor, isFetching } = useActor();

    return useQuery<Array<[string, bigint]>>({
        queryKey: ['inventory-summary'],
        queryFn: async () => {
            if (!actor) return [];
            return actor.getInventorySummary();
        },
        enabled: !!actor && !isFetching
    });
}

export function useCalculateTotalInventoryCost() {
    const { actor, isFetching } = useActor();

    return useQuery<number>({
        queryKey: ['inventory-total-cost'],
        queryFn: async () => {
            if (!actor) return 0;
            return actor.calculateTotalInventoryCost();
        },
        enabled: !!actor && !isFetching
    });
}

export function useCreateClient() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ 
            id, 
            firstName,
            lastName,
            phoneNumber, 
            email, 
            address 
        }: { 
            id: string; 
            firstName: string;
            lastName: string;
            phoneNumber: string; 
            email: string; 
            address: string; 
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.createClient(id, firstName, lastName, phoneNumber, email, address);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}

export function useUpdateClient() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ 
            id, 
            firstName,
            lastName,
            phoneNumber, 
            email, 
            address 
        }: { 
            id: string;
            firstName: string;
            lastName: string;
            phoneNumber: string; 
            email: string; 
            address: string; 
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.updateClient(id, firstName, lastName, phoneNumber, email, address);
            if (!result) throw new Error('Failed to update client');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}

export function useDeleteClient() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.deleteClient(id);
            if (!result) throw new Error('Failed to delete client');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}

export function useCreateEvent() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            name,
            date,
            venue,
            clientId,
            guestCount,
            details,
            staffAssignments,
            menuDetails,
            specialRequests,
            addOnIds,
            venueServices,
            downPaymentAmount,
            fullPaymentAmount,
            isDownPaymentMade,
            isFullPaymentMade
        }: {
            id: string;
            name: string;
            date: bigint;
            venue: string;
            clientId: string;
            guestCount: bigint;
            details: EventDetail[];
            staffAssignments: StaffAssignment[];
            menuDetails: MenuDetail[];
            specialRequests: string;
            addOnIds: string[];
            venueServices: string[];
            downPaymentAmount: number;
            fullPaymentAmount: number;
            isDownPaymentMade: boolean;
            isFullPaymentMade: boolean;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.createEvent(
                id, 
                name, 
                date, 
                venue, 
                clientId, 
                guestCount, 
                details, 
                staffAssignments, 
                menuDetails, 
                specialRequests, 
                addOnIds, 
                0, // depositAmount
                0, // totalCost
                'pending', // paymentStatus
                venueServices,
                downPaymentAmount,
                fullPaymentAmount,
                isDownPaymentMade,
                isFullPaymentMade
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['urgent-events'] });
        }
    });
}

export function useUpdateEvent() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            name,
            date,
            venue,
            clientId,
            guestCount,
            details,
            staffAssignments,
            menuDetails,
            specialRequests,
            addOnIds,
            depositAmount,
            totalCost,
            paymentStatus,
            venueServices,
            downPaymentAmount,
            fullPaymentAmount,
            isDownPaymentMade,
            isFullPaymentMade
        }: {
            id: string;
            name: string;
            date: bigint;
            venue: string;
            clientId: string;
            guestCount: bigint;
            details: EventDetail[];
            staffAssignments: StaffAssignment[];
            menuDetails: MenuDetail[];
            specialRequests: string;
            addOnIds: string[];
            depositAmount: number;
            totalCost: number;
            paymentStatus: string;
            venueServices: string[];
            downPaymentAmount: number;
            fullPaymentAmount: number;
            isDownPaymentMade: boolean;
            isFullPaymentMade: boolean;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            
            // The backend's updateEvent function automatically preserves assignedStaff
            // when positions are regenerated based on guest count and add-ons.
            // No need to fetch current event data here - the backend handles it.
            const result = await actor.updateEvent(
                id, 
                name, 
                date, 
                venue, 
                clientId, 
                guestCount, 
                details, 
                staffAssignments, 
                menuDetails, 
                specialRequests, 
                addOnIds, 
                depositAmount, 
                totalCost, 
                paymentStatus, 
                venueServices,
                downPaymentAmount,
                fullPaymentAmount,
                isDownPaymentMade,
                isFullPaymentMade
            );
            if (!result) throw new Error('Failed to update event');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['urgent-events'] });
        }
    });
}

export function useDeleteEvent() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.deleteEvent(id);
            if (!result) throw new Error('Failed to delete event');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['urgent-events'] });
            queryClient.invalidateQueries({ queryKey: ['archived-events'] });
        }
    });
}

export function useAssignStaffToPosition() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            eventId,
            position,
            staffId
        }: {
            eventId: string;
            position: string;
            staffId: string;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.assignStaffToEvent(eventId, staffId, position);
            if (!result) throw new Error('Failed to assign staff to position');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}

export function useRemoveStaffFromPosition() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            eventId,
            position,
            staffId
        }: {
            eventId: string;
            position: string;
            staffId: string;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.unassignStaffFromEvent(eventId, staffId);
            if (!result) throw new Error('Failed to remove staff from position');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}

export function useAddVenue() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            name,
            address,
            phone,
            hasBar,
            barCover,
            hasIceMachine,
            needsFoodRunner
        }: {
            id: string;
            name: string;
            address: string;
            phone: string;
            hasBar: boolean;
            barCover: string;
            hasIceMachine: boolean;
            needsFoodRunner: boolean;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.addVenue(id, name, address, phone, hasBar, barCover, hasIceMachine, needsFoodRunner);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['venues'] });
        }
    });
}

export function useUpdateVenue() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            name,
            address,
            phone,
            hasBar,
            barCover,
            hasIceMachine,
            needsFoodRunner
        }: {
            id: string;
            name: string;
            address: string;
            phone: string;
            hasBar: boolean;
            barCover: string;
            hasIceMachine: boolean;
            needsFoodRunner: boolean;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.updateVenue(id, name, address, phone, hasBar, barCover, hasIceMachine, needsFoodRunner);
            if (!result) throw new Error('Failed to update venue');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['venues'] });
        }
    });
}

export function useDeleteVenue() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.deleteVenue(id);
            if (!result) throw new Error('Failed to delete venue');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['venues'] });
        }
    });
}

export function useCreateVenueService() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            name
        }: {
            id: string;
            name: string;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.createVenueService(id, name);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['venue-services'] });
        }
    });
}

export function useDeleteVenueService() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.deleteVenueService(id);
            if (!result) throw new Error('Failed to delete venue service');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['venue-services'] });
            queryClient.invalidateQueries({ queryKey: ['venues'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}

export function useAssignServiceToVenue() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            venueId,
            serviceId
        }: {
            venueId: string;
            serviceId: string;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.assignServiceToVenue(venueId, serviceId);
            if (!result) throw new Error('Failed to assign service to venue');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['venues'] });
        }
    });
}

export function useRemoveServiceFromVenue() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            venueId,
            serviceId
        }: {
            venueId: string;
            serviceId: string;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.removeServiceFromVenue(venueId, serviceId);
            if (!result) throw new Error('Failed to remove service from venue');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['venues'] });
        }
    });
}

export function useCreateStaff() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            firstName,
            lastName,
            phoneNumber,
            email,
            positions,
            joinedDate,
            payRate
        }: {
            id: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
            email: string;
            positions: string[];
            joinedDate: bigint;
            payRate?: number | null;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.createStaff(id, firstName, lastName, phoneNumber, email, positions, joinedDate, payRate ?? null);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
        }
    });
}

export function useUpdateStaff() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            firstName,
            lastName,
            phoneNumber,
            email,
            positions,
            joinedDate,
            payRate
        }: {
            id: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
            email: string;
            positions: string[];
            joinedDate: bigint;
            payRate?: number | null;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.updateStaff(id, firstName, lastName, phoneNumber, email, positions, joinedDate, payRate ?? null);
            if (!result) throw new Error('Failed to update staff');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}

export function useDeleteStaff() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.deleteStaff(id);
            if (!result) throw new Error('Failed to delete staff');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}

export function useCreateEmailTemplate() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            title,
            content
        }: {
            id: string;
            title: string;
            content: string;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.createEmailTemplate(id, title, content);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
        }
    });
}

export function useUpdateEmailTemplate() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            title,
            content
        }: {
            id: string;
            title: string;
            content: string;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.updateEmailTemplate(id, title, content);
            if (!result) throw new Error('Failed to update email template');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
        }
    });
}

export function useDeleteEmailTemplate() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.deleteEmailTemplate(id);
            if (!result) throw new Error('Failed to delete email template');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
        }
    });
}

export function useAddMenuCategory() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            name
        }: {
            id: string;
            name: string;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.addMenuCategory(id, name);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
        }
    });
}

export function useDeleteMenuCategory() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.deleteMenuCategory(id);
            if (!result) throw new Error('Failed to delete menu category');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}

export function useAddSubcategoryToMenuCategory() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            categoryId,
            subcategory
        }: {
            categoryId: string;
            subcategory: string;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.addSubcategoryToMenuCategory(categoryId, subcategory);
            if (!result) throw new Error('Failed to add subcategory');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
        }
    });
}

export function useRemoveSubcategoryFromMenuCategory() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            categoryId,
            subcategory
        }: {
            categoryId: string;
            subcategory: string;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.removeSubcategoryFromMenuCategory(categoryId, subcategory);
            if (!result) throw new Error('Failed to remove subcategory');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
        }
    });
}

export function useCreateAddOn() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            name,
            associatedPositions
        }: {
            id: string;
            name: string;
            associatedPositions: string[];
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.createAddOn(id, name, associatedPositions);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['add-ons'] });
        }
    });
}

export function useUpdateAddOn() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            name,
            associatedPositions
        }: {
            id: string;
            name: string;
            associatedPositions: string[];
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.updateAddOn(id, name, associatedPositions);
            if (!result) throw new Error('Failed to update add-on');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['add-ons'] });
        }
    });
}

export function useDeleteAddOn() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.deleteAddOn(id);
            if (!result) throw new Error('Failed to delete add-on');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['add-ons'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        }
    });
}

export function useCreateStaffingRule() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            minGuests,
            maxGuests,
            requiredPositions,
            optionalPositions,
            extraConditions
        }: {
            id: string;
            minGuests: bigint;
            maxGuests: bigint;
            requiredPositions: PositionRequirement[];
            optionalPositions: PositionRequirement[];
            extraConditions: ExtraCondition[];
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.createStaffingRule(id, minGuests, maxGuests, requiredPositions, optionalPositions, extraConditions);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staffing-rules'] });
        }
    });
}

export function useUpdateStaffingRule() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            minGuests,
            maxGuests,
            requiredPositions,
            optionalPositions,
            extraConditions
        }: {
            id: string;
            minGuests: bigint;
            maxGuests: bigint;
            requiredPositions: PositionRequirement[];
            optionalPositions: PositionRequirement[];
            extraConditions: ExtraCondition[];
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.updateStaffingRule(id, minGuests, maxGuests, requiredPositions, optionalPositions, extraConditions);
            if (!result) throw new Error('Failed to update staffing rule');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staffing-rules'] });
        }
    });
}

export function useDeleteStaffingRule() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.deleteStaffingRule(id);
            if (!result) throw new Error('Failed to delete staffing rule');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staffing-rules'] });
        }
    });
}

export function useSetDailyEventLimit() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (limit: bigint) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.setDailyEventLimit(limit);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['daily-event-limit'] });
        }
    });
}

export function useAddInventoryItem() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            name,
            details,
            cost,
            quantity,
            category
        }: {
            id: string;
            name: string;
            details: string;
            cost: number;
            quantity: bigint;
            category: string;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.addInventoryItem(id, name, details, cost, quantity, category);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-total-cost'] });
        }
    });
}

export function useUpdateInventoryItem() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            name,
            details,
            cost,
            quantity,
            category
        }: {
            id: string;
            name: string;
            details: string;
            cost: number;
            quantity: bigint;
            category: string;
        }) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.updateInventoryItem(id, name, details, cost, quantity, category);
            if (!result) throw new Error('Failed to update inventory item');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-total-cost'] });
        }
    });
}

export function useDeleteInventoryItem() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!actor) throw new Error('Actor not initialized');
            const result = await actor.deleteInventoryItem(id);
            if (!result) throw new Error('Failed to delete inventory item');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-total-cost'] });
        }
    });
}

export function useDeleteAllData() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            if (!actor) throw new Error('Actor not initialized');
            return actor.deleteAllData();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            queryClient.invalidateQueries({ queryKey: ['venues'] });
            queryClient.invalidateQueries({ queryKey: ['urgent-events'] });
            queryClient.invalidateQueries({ queryKey: ['archived-events'] });
        }
    });
}
