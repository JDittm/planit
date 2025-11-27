import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Registry "blob-storage/registry";
import OutCall "http-outcalls/outcall";
import Principal "mo:base/Principal";
import AccessControl "authorization/access-control";
import Float "mo:base/Float";
import Debug "mo:base/Debug";
import Result "mo:base/Result";

actor EventPlanning {
  transient let textMap = OrderedMap.Make<Text>(Text.compare);
  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);

  // Initialize the access control system
  let accessControlState = AccessControl.initState();

  type Client = {
    id : Text;
    firstName : Text;
    lastName : Text;
    phoneNumber : Text;
    email : Text;
    address : Text;
  };

  type EventDetail = {
    name : Text;
    isConfirmed : Bool;
    specificInfo : Text;
  };

  type Event = {
    id : Text;
    name : Text;
    date : Int;
    venue : Text;
    clientId : Text;
    guestCount : Nat;
    details : [EventDetail];
    staffAssignments : [StaffAssignment];
    menuDetails : [MenuDetail];
    specialRequests : Text;
    positions : [EventPosition];
    isArchived : Bool;
    depositAmount : Float;
    totalCost : Float;
    paymentStatus : Text;
    venueServices : [Text];
    addOnIds : [Text];
    paymentDetails : PaymentDetails;
  };

  type PaymentDetails = {
    downPaymentAmount : Float;
    fullPaymentAmount : Float;
    isDownPaymentMade : Bool;
    isFullPaymentMade : Bool;
  };

  type Venue = {
    id : Text;
    name : Text;
    address : Text;
    phone : Text;
    hasBar : Bool;
    barCover : Text;
    hasIceMachine : Bool;
    needsFoodRunner : Bool;
    services : [Text];
  };

  type EmailTemplate = {
    id : Text;
    title : Text;
    content : Text;
    createdAt : Int;
  };

  type Staff = {
    id : Text;
    firstName : Text;
    lastName : Text;
    phoneNumber : Text;
    email : Text;
    positions : [Text];
    joinedDate : Int;
    payRate : ?Float;
  };

  type StaffAssignment = {
    staffId : Text;
    position : Text;
  };

  type MenuDetail = {
    category : Text;
    items : [MenuItem];
    beginServingTime : ?Int;
    endServingTime : ?Int;
    notes : Text;
  };

  type MenuItem = {
    name : Text;
    details : [Text];
  };

  type EventPosition = {
    position : Text;
    requiredCount : Nat;
    assignedStaff : [Text];
  };

  type GeocodeResult = {
    lat : Text;
    lon : Text;
  };

  public type UserProfile = {
    name : Text;
    companyName : Text;
    theme : Text;
  };

  type MenuCategory = {
    id : Text;
    name : Text;
    subcategories : [Text];
  };

  type JobPosition = {
    id : Text;
    name : Text;
    description : Text;
    isActive : Bool;
  };

  type AddOn = {
    id : Text;
    name : Text;
    associatedPositions : [Text];
  };

  type StaffingRule = {
    id : Text;
    minGuests : Nat;
    maxGuests : Nat;
    requiredPositions : [PositionRequirement];
    optionalPositions : [PositionRequirement];
    extraConditions : [ExtraCondition];
  };

  type PositionRequirement = {
    position : Text;
    count : Nat;
  };

  type ExtraCondition = {
    condition : Text;
    position : Text;
    count : Nat;
    description : Text;
  };

  type InventoryItem = {
    id : Text;
    name : Text;
    details : Text;
    cost : Float;
    quantity : Nat;
    category : Text;
  };

  type VenueService = {
    id : Text;
    name : Text;
  };

  var clients : OrderedMap.Map<Text, Client> = textMap.empty<Client>();
  var events : OrderedMap.Map<Text, Event> = textMap.empty<Event>();
  var venues : OrderedMap.Map<Text, Venue> = textMap.empty<Venue>();
  var emailTemplates : OrderedMap.Map<Text, EmailTemplate> = textMap.empty<EmailTemplate>();
  var staff : OrderedMap.Map<Text, Staff> = textMap.empty<Staff>();
  var userAddress : Text = "";
  var perMileCost : Float = 0.0;
  var userProfiles : OrderedMap.Map<Principal, UserProfile> = principalMap.empty<UserProfile>();
  var menuCategories : OrderedMap.Map<Text, MenuCategory> = textMap.empty<MenuCategory>();
  var jobPositions : OrderedMap.Map<Text, JobPosition> = textMap.empty<JobPosition>();
  var addOns : OrderedMap.Map<Text, AddOn> = textMap.empty<AddOn>();
  var staffingRules : OrderedMap.Map<Text, StaffingRule> = textMap.empty<StaffingRule>();
  var dailyEventLimit : Nat = 3;
  var venueServices : OrderedMap.Map<Text, VenueService> = textMap.empty<VenueService>();
  var inventory : OrderedMap.Map<Text, InventoryItem> = textMap.empty<InventoryItem>();

  let registry = Registry.new();

  // Access Control Functions
  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // Client Operations - No authorization restrictions per spec
  public shared func createClient(id : Text, firstName : Text, lastName : Text, phoneNumber : Text, email : Text, address : Text) : async () {
    let client : Client = {
      id;
      firstName;
      lastName;
      phoneNumber;
      email;
      address;
    };
    clients := textMap.put(clients, id, client);
  };

  public query func getClient(id : Text) : async ?Client {
    textMap.get(clients, id);
  };

  public query func getAllClients() : async [Client] {
    let allClients = Iter.toArray(textMap.vals(clients));
    Array.sort<Client>(allClients, func(a, b) { Text.compare(a.lastName, b.lastName) });
  };

  public query func searchClients(searchTerm : Text) : async [Client] {
    let allClients = Iter.toArray(textMap.vals(clients));
    let filtered = Array.filter<Client>(
      allClients,
      func(client) {
        Text.contains(Text.toLowercase(client.firstName), #text(Text.toLowercase(searchTerm))) or
        Text.contains(Text.toLowercase(client.lastName), #text(Text.toLowercase(searchTerm))) or
        Text.contains(Text.toLowercase(client.phoneNumber), #text(Text.toLowercase(searchTerm))) or
        Text.contains(Text.toLowercase(client.email), #text(Text.toLowercase(searchTerm))) or
        Text.contains(Text.toLowercase(client.address), #text(Text.toLowercase(searchTerm)));
      },
    );
    Array.sort<Client>(filtered, func(a, b) { Text.compare(a.lastName, b.lastName) });
  };

  public shared func updateClient(id : Text, firstName : Text, lastName : Text, phoneNumber : Text, email : Text, address : Text) : async Bool {
    switch (textMap.get(clients, id)) {
      case (null) { false };
      case (?_) {
        let updatedClient : Client = {
          id;
          firstName;
          lastName;
          phoneNumber;
          email;
          address;
        };
        clients := textMap.put(clients, id, updatedClient);
        true;
      };
    };
  };

  public shared func deleteClient(id : Text) : async Bool {
    let (newClients, removedClient) = textMap.remove(clients, id);
    clients := newClients;
    switch (removedClient) {
      case (null) { false };
      case (?_) { true };
    };
  };

  // Venue Operations - No authorization restrictions per spec
  public shared func addVenue(id : Text, name : Text, address : Text, phone : Text, hasBar : Bool, barCover : Text, hasIceMachine : Bool, needsFoodRunner : Bool) : async () {
    let venue : Venue = {
      id;
      name;
      address;
      phone;
      hasBar;
      barCover;
      hasIceMachine;
      needsFoodRunner;
      services = [];
    };
    venues := textMap.put(venues, id, venue);
  };

  public query func getVenue(id : Text) : async ?Venue {
    textMap.get(venues, id);
  };

  public query func getAllVenues() : async [Venue] {
    Iter.toArray(textMap.vals(venues));
  };

  public shared func updateVenue(id : Text, name : Text, address : Text, phone : Text, hasBar : Bool, barCover : Text, hasIceMachine : Bool, needsFoodRunner : Bool) : async Bool {
    switch (textMap.get(venues, id)) {
      case (null) { false };
      case (?venue) {
        let updatedVenue : Venue = {
          id;
          name;
          address;
          phone;
          hasBar;
          barCover;
          hasIceMachine;
          needsFoodRunner;
          services = venue.services;
        };
        venues := textMap.put(venues, id, updatedVenue);
        true;
      };
    };
  };

  public shared func deleteVenue(id : Text) : async Bool {
    let (newVenues, removedVenue) = textMap.remove(venues, id);
    venues := newVenues;
    switch (removedVenue) {
      case (null) { false };
      case (?_) { true };
    };
  };

  // Venue Service Operations - No authorization restrictions per spec
  public shared func createVenueService(id : Text, name : Text) : async () {
    let service : VenueService = {
      id;
      name;
    };
    venueServices := textMap.put(venueServices, id, service);
  };

  public shared func deleteVenueService(id : Text) : async Bool {
    let (newServices, removedService) = textMap.remove(venueServices, id);
    venueServices := newServices;
    switch (removedService) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public query func getAllVenueServices() : async [VenueService] {
    Iter.toArray(textMap.vals(venueServices));
  };

  public shared func assignServiceToVenue(venueId : Text, serviceId : Text) : async Bool {
    switch (textMap.get(venues, venueId)) {
      case (null) { false };
      case (?venue) {
        let updatedServices = Array.append(venue.services, [serviceId]);
        let updatedVenue : Venue = {
          id = venue.id;
          name = venue.name;
          address = venue.address;
          phone = venue.phone;
          hasBar = venue.hasBar;
          barCover = venue.barCover;
          hasIceMachine = venue.hasIceMachine;
          needsFoodRunner = venue.needsFoodRunner;
          services = updatedServices;
        };
        venues := textMap.put(venues, venueId, updatedVenue);
        true;
      };
    };
  };

  public shared func removeServiceFromVenue(venueId : Text, serviceId : Text) : async Bool {
    switch (textMap.get(venues, venueId)) {
      case (null) { false };
      case (?venue) {
        let updatedServices = Array.filter<Text>(venue.services, func(s) { s != serviceId });
        let updatedVenue : Venue = {
          id = venue.id;
          name = venue.name;
          address = venue.address;
          phone = venue.phone;
          hasBar = venue.hasBar;
          barCover = venue.barCover;
          hasIceMachine = venue.hasIceMachine;
          needsFoodRunner = venue.needsFoodRunner;
          services = updatedServices;
        };
        venues := textMap.put(venues, venueId, updatedVenue);
        true;
      };
    };
  };

  // Event Operations - No authorization restrictions per spec
  public shared func createEvent(id : Text, name : Text, date : Int, venue : Text, clientId : Text, guestCount : Nat, details : [EventDetail], staffAssignments : [StaffAssignment], menuDetails : [MenuDetail], specialRequests : Text, addOnIds : [Text], depositAmount : Float, totalCost : Float, paymentStatus : Text, venueServices : [Text], downPaymentAmount : Float, fullPaymentAmount : Float, isDownPaymentMade : Bool, isFullPaymentMade : Bool) : async () {
    let positions = await generatePositions(guestCount, addOnIds);
    let paymentDetails : PaymentDetails = {
      downPaymentAmount;
      fullPaymentAmount;
      isDownPaymentMade;
      isFullPaymentMade;
    };
    let event : Event = {
      id;
      name;
      date;
      venue;
      clientId;
      guestCount;
      details;
      staffAssignments;
      menuDetails;
      specialRequests;
      positions;
      isArchived = false;
      depositAmount;
      totalCost;
      paymentStatus;
      venueServices;
      addOnIds;
      paymentDetails;
    };
    events := textMap.put(events, id, event);
  };

  // Shared updateEvent function that preserves assignedStaff
  public shared func updateEvent(
    id : Text,
    name : Text,
    date : Int,
    venue : Text,
    clientId : Text,
    guestCount : Nat,
    details : [EventDetail],
    staffAssignments : [StaffAssignment],
    menuDetails : [MenuDetail],
    specialRequests : Text,
    addOnIds : [Text],
    depositAmount : Float,
    totalCost : Float,
    paymentStatus : Text,
    venueServices : [Text],
    downPaymentAmount : Float,
    fullPaymentAmount : Float,
    isDownPaymentMade : Bool,
    isFullPaymentMade : Bool
  ) : async Bool {
    switch (textMap.get(events, id)) {
      case (null) { false };
      case (?existingEvent) {
        let positions = await generatePositions(guestCount, addOnIds);
        
        // Preserve existing assignedStaff in positions if not provided
        let updatedPositions = Array.map<EventPosition, EventPosition>(
          positions,
          func(newPos) {
            let existingPos = Array.find<EventPosition>(
              existingEvent.positions,
              func(p) { p.position == newPos.position }
            );
            switch (existingPos) {
              case (null) { newPos };
              case (?existing) {
                {
                  position = newPos.position;
                  requiredCount = newPos.requiredCount;
                  assignedStaff = existing.assignedStaff;
                }
              };
            };
          }
        );

        let paymentDetails : PaymentDetails = {
          downPaymentAmount;
          fullPaymentAmount;
          isDownPaymentMade;
          isFullPaymentMade;
        };

        let updatedEvent : Event = {
          id;
          name;
          date;
          venue;
          clientId;
          guestCount;
          details;
          staffAssignments;
          menuDetails;
          specialRequests;
          positions = updatedPositions;
          isArchived = existingEvent.isArchived;
          depositAmount;
          totalCost;
          paymentStatus;
          venueServices;
          addOnIds;
          paymentDetails;
        };
        events := textMap.put(events, id, updatedEvent);
        true;
      };
    };
  };

  public query func getEvent(id : Text) : async ?Event {
    textMap.get(events, id);
  };

  public query func getEventsByClient(clientId : Text) : async [Event] {
    let allEvents = Iter.toArray(textMap.vals(events));
    Array.filter<Event>(allEvents, func(e) { e.clientId == clientId });
  };

  func generatePositions(guestCount : Nat, addOnIds : [Text]) : async [EventPosition] {
    var positions : [EventPosition] = [];

    // Apply staffing rules
    let allRules = Iter.toArray(textMap.vals(staffingRules));
    let applicableRules = Array.filter<StaffingRule>(
      allRules,
      func(rule) {
        guestCount >= rule.minGuests and guestCount <= rule.maxGuests
      },
    );

    for (rule in applicableRules.vals()) {
      for (req in rule.requiredPositions.vals()) {
        positions := Array.append(positions, [{ position = req.position; requiredCount = req.count; assignedStaff = [] }]);
      };

      // Apply extra conditions
      for (cond in rule.extraConditions.vals()) {
        if (shouldApplyCondition(cond.condition, addOnIds)) {
          positions := Array.append(positions, [{ position = cond.position; requiredCount = cond.count; assignedStaff = [] }]);
        };
      };
    };

    // Add optional positions based on add-ons
    for (addOnId in addOnIds.vals()) {
      switch (textMap.get(addOns, addOnId)) {
        case (null) {};
        case (?addOn) {
          for (pos in addOn.associatedPositions.vals()) {
            positions := Array.append(positions, [{ position = pos; requiredCount = 1; assignedStaff = [] }]);
          };
        };
      };
    };

    positions;
  };

  func shouldApplyCondition(condition : Text, addOnIds : [Text]) : Bool {
    switch (condition) {
      case ("bar_included") {
        Array.find<Text>(addOnIds, func(id) { id == "bar" }) != null;
      };
      case (_) { false };
    };
  };

  public shared func deleteEvent(id : Text) : async Bool {
    let (newEvents, removedEvent) = textMap.remove(events, id);
    events := newEvents;
    switch (removedEvent) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public shared func archivePastEvents() : async () {
    let currentTime = Time.now();
    let allEvents = Iter.toArray(textMap.vals(events));

    for (event in allEvents.vals()) {
      if (event.date < currentTime and not event.isArchived) {
        let updatedEvent : Event = {
          id = event.id;
          name = event.name;
          date = event.date;
          venue = event.venue;
          clientId = event.clientId;
          guestCount = event.guestCount;
          details = event.details;
          staffAssignments = event.staffAssignments;
          menuDetails = event.menuDetails;
          specialRequests = event.specialRequests;
          positions = event.positions;
          isArchived = true;
          depositAmount = event.depositAmount;
          totalCost = event.totalCost;
          paymentStatus = event.paymentStatus;
          venueServices = event.venueServices;
          addOnIds = event.addOnIds;
          paymentDetails = event.paymentDetails;
        };
        events := textMap.put(events, event.id, updatedEvent);
      };
    };
  };

  public query func getArchivedEvents() : async [Event] {
    let allEvents = Iter.toArray(textMap.vals(events));
    Array.filter<Event>(allEvents, func(e) { e.isArchived });
  };

  // Staff Operations - No authorization restrictions per spec
  public shared func createStaff(id : Text, firstName : Text, lastName : Text, phoneNumber : Text, email : Text, positions : [Text], joinedDate : Int, payRate : ?Float) : async () {
    let staffMember : Staff = {
      id;
      firstName;
      lastName;
      phoneNumber;
      email;
      positions;
      joinedDate;
      payRate;
    };
    staff := textMap.put(staff, id, staffMember);
  };

  public query func getStaff(id : Text) : async ?Staff {
    textMap.get(staff, id);
  };

  public query func getAllStaff() : async [Staff] {
    Iter.toArray(textMap.vals(staff));
  };

  public shared func updateStaff(id : Text, firstName : Text, lastName : Text, phoneNumber : Text, email : Text, positions : [Text], joinedDate : Int, payRate : ?Float) : async Bool {
    switch (textMap.get(staff, id)) {
      case (null) { false };
      case (?_) {
        let updatedStaff : Staff = {
          id;
          firstName;
          lastName;
          phoneNumber;
          email;
          positions;
          joinedDate;
          payRate;
        };
        staff := textMap.put(staff, id, updatedStaff);
        true;
      };
    };
  };

  public shared func deleteStaff(id : Text) : async Bool {
    let (newStaff, removedStaff) = textMap.remove(staff, id);
    staff := newStaff;
    switch (removedStaff) {
      case (null) { false };
      case (?_) { true };
    };
  };

  // Staff Assignment Operations - No authorization restrictions per spec
  public shared func assignStaffToEvent(eventId : Text, staffId : Text, position : Text) : async Bool {
    switch (textMap.get(events, eventId)) {
      case (null) { false };
      case (?event) {
        let updatedAssignments = Array.append(event.staffAssignments, [{ staffId; position }]);
        let updatedEvent : Event = {
          id = event.id;
          name = event.name;
          date = event.date;
          venue = event.venue;
          clientId = event.clientId;
          guestCount = event.guestCount;
          details = event.details;
          staffAssignments = updatedAssignments;
          menuDetails = event.menuDetails;
          specialRequests = event.specialRequests;
          positions = event.positions;
          isArchived = event.isArchived;
          depositAmount = event.depositAmount;
          totalCost = event.totalCost;
          paymentStatus = event.paymentStatus;
          venueServices = event.venueServices;
          addOnIds = event.addOnIds;
          paymentDetails = event.paymentDetails;
        };
        events := textMap.put(events, eventId, updatedEvent);
        true;
      };
    };
  };

  public shared func unassignStaffFromEvent(eventId : Text, staffId : Text) : async Bool {
    switch (textMap.get(events, eventId)) {
      case (null) { false };
      case (?event) {
        let updatedAssignments = Array.filter<StaffAssignment>(event.staffAssignments, func(a) { a.staffId != staffId });
        let updatedEvent : Event = {
          id = event.id;
          name = event.name;
          date = event.date;
          venue = event.venue;
          clientId = event.clientId;
          guestCount = event.guestCount;
          details = event.details;
          staffAssignments = updatedAssignments;
          menuDetails = event.menuDetails;
          specialRequests = event.specialRequests;
          positions = event.positions;
          isArchived = event.isArchived;
          depositAmount = event.depositAmount;
          totalCost = event.totalCost;
          paymentStatus = event.paymentStatus;
          venueServices = event.venueServices;
          addOnIds = event.addOnIds;
          paymentDetails = event.paymentDetails;
        };
        events := textMap.put(events, eventId, updatedEvent);
        true;
      };
    };
  };

  // Email Template Operations - No authorization restrictions
  public shared func createEmailTemplate(id : Text, title : Text, content : Text) : async () {
    let now = Time.now();
    let template : EmailTemplate = {
      id;
      title;
      content;
      createdAt = now;
    };
    emailTemplates := textMap.put(emailTemplates, id, template);
  };

  public query func getEmailTemplate(id : Text) : async ?EmailTemplate {
    textMap.get(emailTemplates, id);
  };

  public query func getAllEmailTemplates() : async [EmailTemplate] {
    let allTemplates = Iter.toArray(textMap.vals(emailTemplates));
    Array.sort<EmailTemplate>(allTemplates, func(a, b) { Text.compare(a.title, b.title) });
  };

  public shared func updateEmailTemplate(id : Text, title : Text, content : Text) : async Bool {
    switch (textMap.get(emailTemplates, id)) {
      case (null) { false };
      case (?template) {
        let updatedTemplate : EmailTemplate = {
          id = template.id;
          title;
          content;
          createdAt = template.createdAt;
        };
        emailTemplates := textMap.put(emailTemplates, id, updatedTemplate);
        true;
      };
    };
  };

  public shared func deleteEmailTemplate(id : Text) : async Bool {
    let (newTemplates, removedTemplate) = textMap.remove(emailTemplates, id);
    emailTemplates := newTemplates;
    switch (removedTemplate) {
      case (null) { false };
      case (?_) { true };
    };
  };

  // Reminder System - No authorization restrictions
  public query func getEventsWithPendingDetails() : async [Event] {
    let currentTime = Time.now();
    let oneMonthNanos = 30 * 24 * 60 * 60 * 1000000000;
    let allEvents = Iter.toArray(textMap.vals(events));

    Array.filter<Event>(
      allEvents,
      func(e) {
        let isWithinMonth = (e.date - currentTime) <= oneMonthNanos;
        let hasPendingDetails = Array.find<EventDetail>(e.details, func(d) { not d.isConfirmed }) != null;
        isWithinMonth and hasPendingDetails;
      },
    );
  };

  // Dashboard Data - No authorization restrictions
  public query func getDashboardData() : async [(Client, [Event])] {
    let allClients = Iter.toArray(textMap.vals(clients));
    let allEvents = Iter.toArray(textMap.vals(events));

    Array.map<Client, (Client, [Event])>(
      allClients,
      func(client) {
        let clientEvents = Array.filter<Event>(allEvents, func(e) { e.clientId == client.id });
        (client, clientEvents);
      },
    );
  };

  // File Reference Operations - No authorization restrictions
  public shared func registerFileReference(path : Text, hash : Text) : async () {
    Registry.add(registry, path, hash);
  };

  public query func getFileReference(path : Text) : async Registry.FileReference {
    Registry.get(registry, path);
  };

  public query func listFileReferences() : async [Registry.FileReference] {
    Registry.list(registry);
  };

  public shared func dropFileReference(path : Text) : async () {
    Registry.remove(registry, path);
  };

  // Distance and Travel Cost Calculation - No authorization restrictions
  public shared func setUserAddress(address : Text) : async () {
    userAddress := address;
  };

  public query func getUserAddress() : async Text {
    userAddress;
  };

  public shared func setPerMileCost(cost : Float) : async () {
    perMileCost := cost;
  };

  public query func getPerMileCost() : async Float {
    perMileCost;
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared func calculateDistance(from : Text, to : Text) : async Text {
    let url = "https://maps.googleapis.com/maps/api/distancematrix/json?origins=" # from # "&destinations=" # to # "&key=YOUR_GOOGLE_MAPS_API_KEY";
    await OutCall.httpGetRequest(url, [], transform);
  };

  // User Profile Operations - Authorization required per instructions
  public shared ({ caller }) func deleteAllData() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can delete all data");
    };
    clients := textMap.empty<Client>();
    events := textMap.empty<Event>();
    venues := textMap.empty<Venue>();
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can view profiles");
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Unauthorized: Can only view your own profile");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  // Menu Management Operations - No authorization restrictions per spec
  public shared func addMenuCategory(id : Text, name : Text) : async () {
    let category : MenuCategory = {
      id;
      name;
      subcategories = [];
    };
    menuCategories := textMap.put(menuCategories, id, category);
  };

  public shared func deleteMenuCategory(id : Text) : async Bool {
    let (newCategories, removedCategory) = textMap.remove(menuCategories, id);
    menuCategories := newCategories;
    switch (removedCategory) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public shared func addSubcategoryToMenuCategory(categoryId : Text, subcategory : Text) : async Bool {
    switch (textMap.get(menuCategories, categoryId)) {
      case (null) { false };
      case (?category) {
        let updatedSubcategories = Array.append(category.subcategories, [subcategory]);
        let updatedCategory : MenuCategory = {
          id = category.id;
          name = category.name;
          subcategories = updatedSubcategories;
        };
        menuCategories := textMap.put(menuCategories, categoryId, updatedCategory);
        true;
      };
    };
  };

  public shared func removeSubcategoryFromMenuCategory(categoryId : Text, subcategory : Text) : async Bool {
    switch (textMap.get(menuCategories, categoryId)) {
      case (null) { false };
      case (?category) {
        let updatedSubcategories = Array.filter<Text>(category.subcategories, func(s) { s != subcategory });
        let updatedCategory : MenuCategory = {
          id = category.id;
          name = category.name;
          subcategories = updatedSubcategories;
        };
        menuCategories := textMap.put(menuCategories, categoryId, updatedCategory);
        true;
      };
    };
  };

  public query func getAllMenuCategories() : async [MenuCategory] {
    Iter.toArray(textMap.vals(menuCategories));
  };

  // Job Position Management - No authorization restrictions per spec
  public shared func createJobPosition(id : Text, name : Text, description : Text) : async () {
    let position : JobPosition = {
      id;
      name;
      description;
      isActive = true;
    };
    jobPositions := textMap.put(jobPositions, id, position);
  };

  public shared func updateJobPosition(id : Text, name : Text, description : Text, isActive : Bool) : async Bool {
    switch (textMap.get(jobPositions, id)) {
      case (null) { false };
      case (?_) {
        let updatedPosition : JobPosition = {
          id;
          name;
          description;
          isActive;
        };
        jobPositions := textMap.put(jobPositions, id, updatedPosition);
        true;
      };
    };
  };

  public shared func deleteJobPosition(id : Text) : async Bool {
    let (newPositions, removedPosition) = textMap.remove(jobPositions, id);
    jobPositions := newPositions;
    switch (removedPosition) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public query func getAllJobPositions() : async [JobPosition] {
    Iter.toArray(textMap.vals(jobPositions));
  };

  // Add-On Management - No authorization restrictions
  public shared func createAddOn(id : Text, name : Text, associatedPositions : [Text]) : async () {
    let addOn : AddOn = {
      id;
      name;
      associatedPositions;
    };
    addOns := textMap.put(addOns, id, addOn);
  };

  public shared func updateAddOn(id : Text, name : Text, associatedPositions : [Text]) : async Bool {
    switch (textMap.get(addOns, id)) {
      case (null) { false };
      case (?_) {
        let updatedAddOn : AddOn = {
          id;
          name;
          associatedPositions;
        };
        addOns := textMap.put(addOns, id, updatedAddOn);
        true;
      };
    };
  };

  public shared func deleteAddOn(id : Text) : async Bool {
    let (newAddOns, removedAddOn) = textMap.remove(addOns, id);
    addOns := newAddOns;
    switch (removedAddOn) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public query func getAllAddOns() : async [AddOn] {
    Iter.toArray(textMap.vals(addOns));
  };

  // Staffing Rules Management - No authorization restrictions
  public shared func createStaffingRule(id : Text, minGuests : Nat, maxGuests : Nat, requiredPositions : [PositionRequirement], optionalPositions : [PositionRequirement], extraConditions : [ExtraCondition]) : async () {
    let rule : StaffingRule = {
      id;
      minGuests;
      maxGuests;
      requiredPositions;
      optionalPositions;
      extraConditions;
    };
    staffingRules := textMap.put(staffingRules, id, rule);
  };

  public shared func updateStaffingRule(id : Text, minGuests : Nat, maxGuests : Nat, requiredPositions : [PositionRequirement], optionalPositions : [PositionRequirement], extraConditions : [ExtraCondition]) : async Bool {
    switch (textMap.get(staffingRules, id)) {
      case (null) { false };
      case (?_) {
        let updatedRule : StaffingRule = {
          id;
          minGuests;
          maxGuests;
          requiredPositions;
          optionalPositions;
          extraConditions;
        };
        staffingRules := textMap.put(staffingRules, id, updatedRule);
        true;
      };
    };
  };

  public shared func deleteStaffingRule(id : Text) : async Bool {
    let (newRules, removedRule) = textMap.remove(staffingRules, id);
    staffingRules := newRules;
    switch (removedRule) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public query func getAllStaffingRules() : async [StaffingRule] {
    Iter.toArray(textMap.vals(staffingRules));
  };

  // Daily Event Limit Management - No authorization restrictions
  public shared func setDailyEventLimit(limit : Nat) : async () {
    dailyEventLimit := limit;
  };

  public query func getDailyEventLimit() : async Nat {
    dailyEventLimit;
  };

  // Validation Functions
  public query func validateEvent(eventId : Text) : async Bool {
    switch (textMap.get(events, eventId)) {
      case (null) { Debug.trap("Event not found") };
      case (?event) {
        if (event.name == "") { Debug.trap("Event name is required") };
        if (event.date <= 0) { Debug.trap("Event date is required") };
        if (event.venue == "") { Debug.trap("Venue is required") };
        if (event.clientId == "") { Debug.trap("Client is required") };
        if (event.guestCount <= 0) { Debug.trap("Guest count is required") };
        if (event.positions.size() == 0) { Debug.trap("At least one position is required") };
        true;
      };
    };
  };

  public query func validateStaff(staffId : Text) : async Bool {
    switch (textMap.get(staff, staffId)) {
      case (null) { Debug.trap("Staff member not found") };
      case (?staff) {
        if (staff.firstName == "") { Debug.trap("First name is required") };
        if (staff.lastName == "") { Debug.trap("Last name is required") };
        if (staff.phoneNumber == "") { Debug.trap("Phone number is required") };
        if (staff.email == "") { Debug.trap("Email is required") };
        if (staff.positions.size() == 0) { Debug.trap("At least one position is required") };
        true;
      };
    };
  };

  public query func validateVenue(venueId : Text) : async Bool {
    switch (textMap.get(venues, venueId)) {
      case (null) { Debug.trap("Venue not found") };
      case (?venue) {
        if (venue.name == "") { Debug.trap("Venue name is required") };
        if (venue.address == "") { Debug.trap("Venue address is required") };
        if (venue.phone == "") { Debug.trap("Venue phone is required") };
        true;
      };
    };
  };

  // Inventory Management Operations - No authorization restrictions
  public shared func addInventoryItem(id : Text, name : Text, details : Text, cost : Float, quantity : Nat, category : Text) : async () {
    let item : InventoryItem = {
      id;
      name;
      details;
      cost;
      quantity;
      category;
    };
    inventory := textMap.put(inventory, id, item);
  };

  public shared func updateInventoryItem(id : Text, name : Text, details : Text, cost : Float, quantity : Nat, category : Text) : async Bool {
    switch (textMap.get(inventory, id)) {
      case (null) { false };
      case (?_) {
        let updatedItem : InventoryItem = {
          id;
          name;
          details;
          cost;
          quantity;
          category;
        };
        inventory := textMap.put(inventory, id, updatedItem);
        true;
      };
    };
  };

  public shared func deleteInventoryItem(id : Text) : async Bool {
    let (newInventory, removedItem) = textMap.remove(inventory, id);
    inventory := newInventory;
    switch (removedItem) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public query func getInventoryItem(id : Text) : async ?InventoryItem {
    textMap.get(inventory, id);
  };

  public query func getAllInventoryItems() : async [InventoryItem] {
    Iter.toArray(textMap.vals(inventory));
  };

  public query func getInventoryByCategory(category : Text) : async [InventoryItem] {
    let allItems = Iter.toArray(textMap.vals(inventory));
    Array.filter<InventoryItem>(allItems, func(item) { item.category == category });
  };

  public query func calculateTotalInventoryCost() : async Float {
    let allItems = Iter.toArray(textMap.vals(inventory));
    Array.foldLeft<InventoryItem, Float>(
      allItems,
      0.0,
      func(acc, item) {
        acc + (item.cost * Float.fromInt(item.quantity));
      },
    );
  };

  public query func getInventorySummary() : async [(Text, Nat)] {
    let allItems = Iter.toArray(textMap.vals(inventory));
    let categories = Array.map<InventoryItem, Text>(allItems, func(item) { item.category });
    let uniqueCategories = Array.foldLeft<Text, [Text]>(
      categories,
      [],
      func(acc, category) {
        if (Array.find<Text>(acc, func(c) { c == category }) == null) {
          Array.append(acc, [category]);
        } else {
          acc;
        };
      },
    );

    Array.map<Text, (Text, Nat)>(
      uniqueCategories,
      func(category) {
        let count = Array.foldLeft<InventoryItem, Nat>(
          allItems,
          0,
          func(acc, item) {
            if (item.category == category) { acc + 1 } else {
              acc;
            };
          },
        );
        (category, count);
      },
    );
  };
};

