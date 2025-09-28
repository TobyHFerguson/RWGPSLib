// ts-check
function getRWGPSObjects_() {
    const Globals = {


        RIDE_LEADER_TBD_NAME: 'To Be Determined',

        A_TEMPLATE: `https://ridewithgps.com/events/404021-a-template`,
        B_TEMPLATE: `https://ridewithgps.com/events/404019-b-template`,
        C_TEMPLATE: `https://ridewithgps.com/events/404022-c-template`,
        SIGN_IN_URI: `https://ridewithgps.com/organizations/47/sign_in`,
        EVENTS_URI: 'https://ridewithgps.com/events/',

        SCCCC_USER_ID: 621846,
        RIDE_LEADER_TBD_ID: 4733240,

    }

    function getRWGPSLib() {
        return head ? RWGPSLib : RWGPSLib7;
    }
    function getRWGPSService() {
        const credentialManager = newCredentialManager(PropertiesService.getScriptProperties())
        return newRWGPSService(Globals, credentialManager);
    }

    const rwgpsService = getRWGPSService();
    const rwgps = newRWGPS(rwgpsService);
    return {
        rwgpsService: rwgpsService,
        rwgps: rwgps,
        globals: Globals
    };
}

function main() {
    console.log('RWGPS Smoke Tests');
    test_batch_delete_events()
    test_batch_delete_routes()
    test_copy_template()
    test_edit_events()
    test_get_event()
    test_get_events()
    test_get_organizers()
    test_importRoute()
    test_tag_events()
    test_untag_events()
    testGetRSVPCounts()
    testGetRSVPObject()
    testGetRSVPObjectByUrl()
}

function test_batch_delete_events() {
    console.log('\n--- Test: batch_delete_events() ---');
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    try {
        const eventUrls = [rwgps.copy_template_(globals.A_TEMPLATE),
        rwgps.copy_template_(globals.A_TEMPLATE)];
        const eventIds = eventUrls.map(url => rwgpsService.extractIdFromUrl(url));
        console.log('Event IDs to delete:', eventIds);
        const deleteResps = rwgps.batch_delete_events(eventUrls);
        console.log('batch_delete_events response code:', deleteResps.getResponseCode());
        const deletedEventIds = JSON.parse(deleteResps.getContentText()).events.map(e => e.id);
        console.log('Deleted event IDs:', deletedEventIds);
    } catch (error) {
        console.error('batch_delete_events() error:', error);
    }
}

function test_batch_delete_routes() {
    console.log('\n--- Test: batch_delete_routes() ---');
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    try {
        const routeUrls = [rwgps.importRoute({
            url: 'https://ridewithgps.com/routes/19551869', // Dummy route ID
            visibility: 0,
            name: 'TEST ROUTE - DELETE ME',
            expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            tags: ['test', 'imported']
        }),
        rwgps.importRoute({
            url: 'https://ridewithgps.com/routes/19551869', // Dummy route ID
            visibility: 0,
            name: 'TEST ROUTE - DELETE ME',
            expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            tags: ['test', 'imported']
        })]
        console.log('Route Urls to delete:', routeUrls);
        const deleteResps = rwgps.batch_delete_routes(routeUrls);
        console.log('batch_delete_routes response code:', deleteResps.getResponseCode());
        const content = deleteResps.getContentText();
        console.log('batch_delete_routes response content:', content);
        const deletedRouteIds = JSON.parse(content).routes.map(r => r.id);
        console.log('Deleted route IDs:', deletedRouteIds);
    } catch (error) {
        console.error('batch_delete_routes() error:', error);
    }
}

function test_copy_template() {
    console.log('\n--- Test: copy_template() ---');
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    const ATemplate = globals.A_TEMPLATE
    try {
        const copyResp = rwgps.copy_template_(ATemplate);
        console.log('copy_template_ result is a Public Event URL:', copyResp);

    } catch (error) {
        console.error('copy_template_() error:', error);
    }
}


function test_edit_event() {

}
function test_edit_events() {
    console.log('\n--- Test: edit_events() ---');
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    try {
        const response1 = rwgps.copy_template_(globals.A_TEMPLATE);
        const newEventUrl1 = response1;
        const newEvent1 = rwgps.get_event(newEventUrl1);
        newEvent1.name = "DELETE ME 1";
        newEvent1.desc = "Updated description 1";

        const response2 = rwgps.copy_template_(globals.A_TEMPLATE);
        const newEventUrl2 = response2;
        const newEvent2 = rwgps.get_event(newEventUrl2);
        newEvent2.name = "DELETE ME 2";
        newEvent2.desc = "Updated description 2";

        const eventEditObjects = [
            { url: newEventUrl1, event: newEvent1 },
            { url: newEventUrl2, event: newEvent2 }
        ];

        const events = rwgps.edit_events(eventEditObjects);
        events.forEach((event, i) => {
            console.log(`Edited Event[${i}] name:`, event.name);
            console.log(`Edited Event[${i}] description:`, event.desc);
            console.log(`Edited Event[${i}] slug:`, event.slug);
        });
    } catch (error) {
        console.error('edit_events() error:', error);
    }
}

function test_get_event() {
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    console.log('\n--- Test: get_event() ---');
    try {
        const eventUrl = globals.A_TEMPLATE;
        const event = rwgps.get_event(eventUrl);
        console.log('Event name:', event.name);
        console.log('Event description:', event.desc);
        console.log('Event slug:', event.slug);
    } catch (error) {
        console.error('get_event() error:', error);
    }
}

function test_get_events() {
    console.log('\n--- Test: get_events() ---');
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    try {
        const events = rwgps.get_events([globals.A_TEMPLATE, globals.A_TEMPLATE]);
        events.forEach((event, i) => {
            console.log(`Event[${i}] name:`, event.name);
            console.log(`Event[${i}] description:`, event.desc);
            console.log(`Event[${i}] slug:`, event.slug);
        });
    } catch (error) {
        console.error('get_events() error:', error);
    }
}

function test_get_organizers() {
    console.log('\n--- Test: getOrganizers() ---');
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    try {   
        const names = ['Toby Ferguson', 'John Doe']

        const organizers = rwgps.getOrganizers(names);
        console.log('Organizers:', organizers);
    } catch (error) {
        console.error('getOrganizers() error:', error);
    }
}

function test_importRoute() {
    console.log('\n--- Test: import_route() ---');
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    let importedRouteUrl;
    try {
        const foreignRoute = {
            url: 'https://ridewithgps.com/routes/19551869', // Dummy route ID
            visibility: 0,
            name: 'TEST ROUTE - DELETE ME',
            expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            tags: ['test', 'imported']
        };
        importedRouteUrl = rwgps.importRoute(foreignRoute);
        console.log('Imported Route URL:', importedRouteUrl);
    } catch (error) {
        console.error('importRoute() error:', error);
        console.log('Skipping deleteRoute() test due to importRoute() failure.');
        return;
    }
}

function test_tag_events() {
    console.log('\n--- Test: tag_events() ---');
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    try {
        const eventUrls = [globals.A_TEMPLATE, globals.B_TEMPLATE, globals.C_TEMPLATE
        ].map(url => rwgps.copy_template_(url));
        const tags = ['test', 'imported'];
        const response = rwgps.tagEvents(eventUrls, tags);
        console.log('tag_events() response code:', response.getResponseCode());
        const content = response.getContentText();
        console.log('tag_events() response content:', content);
        const newEventUrls = JSON.parse(content).events.map(e => 'https://ridewithgps.com/events/' + e.id);
        console.log('Tagged event URLs:', newEventUrls);
        // Clean up by deleting the events
        rwgps.batch_delete_events(newEventUrls);
    } catch (error) {
        console.error('tag_events() error:', error);
    }
}

function test_untag_events() {
    console.log('\n--- Test: untag_events() ---');
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    try {
        const eventUrls = [globals.A_TEMPLATE, globals.B_TEMPLATE, globals.C_TEMPLATE
        ].map(url => rwgps.copy_template_(url));
        const tags = ['test', 'imported'];
        // First tag the events
        rwgps.tagEvents(eventUrls, tags);
        // Now untag them
        const response = rwgps.unTagEvents(eventUrls, [tags[1]]); // Remove the last tag
        console.log('untag_events() response code:', response.getResponseCode());
        const content = response.getContentText();
        console.log('untag_events() response content:', content);
        const untaggedEventUrls = JSON.parse(content).events.map(e => 'https://ridewithgps.com/events/' + e.id);
        console.log('Untagged event URLs:', untaggedEventUrls);
        // Clean up by deleting the events
        rwgps.batch_delete_events(untaggedEventUrls);
    } catch (error) {
        console.error('untag_events() error:', error);
    }
}

function testGetRSVPCounts() {
    console.log('\n--- Test: getRSVPCounts() ---');
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    try {
        const eventUrls = [
            'https://ridewithgps.com/events/341643',
            'https://ridewithgps.com/events/341643',
        ];
        const rsvpCounts = rwgps.getRSVPCounts(eventUrls);
        console.log('RSVP Counts:', rsvpCounts);
    } catch (error) {
        console.error('getRSVPCounts() error:', error);
    }
}

function testGetRSVPObject() {
    console.log('\n--- Test: getRSVPObject() ---');
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    try {
        const eventId = 341643; // Example event ID
        const rsvpObject = rwgps.getRSVPObject(eventId);
        console.log('RSVP Object name:', rsvpObject.name);
        console.log('RSVP Object participants:', rsvpObject.participants.length);
        rsvpObject.participants.forEach((p, i) => {
            console.log(`Participant[${i}]: ${p.first_name} ${p.last_name} ${p.leader ? '(Leader)' : ''}`);
        });
    } catch (error) {
        console.error('getRSVPObject() error:', error);
    }
}

function testGetRSVPObjectByUrl() {
    console.log('\n--- Test: getRSVPObjectByURL() ---');
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    try {
        const eventUrl = 'https://ridewithgps.com/events/341643';
        const rsvpObject = rwgps.getRSVPObjectByURL(eventUrl);
        console.log('RSVP Object name:', rsvpObject.name);
        console.log('RSVP Object participants:', rsvpObject.participants.length);
        rsvpObject.participants.forEach((p, i) => {
            console.log(`Participant[${i}]: ${p.first_name} ${p.last_name} ${p.leader ? '(Leader)' : ''}`);
        });
    } catch (error) {
        console.error('getRSVPObjectByURL() error:', error);
    }
}
