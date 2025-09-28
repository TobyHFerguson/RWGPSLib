function main() {
    console.log('RWGPS Smoke Tests');
    test_get_event()
    test_get_events()
    test_copy_template()
    test_batch_delete_events()
    testGetRSVPObjectByUrl()
    testGetRSVPObject()
    testGetRSVPCounts()
}

function test_get_event() {
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    console.log('\n--- Test: get_event() ---');
    try {
        const eventUrl = 'https://ridewithgps.com/events/186557-a-template';
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
        const events = rwgps.get_events(['https://ridewithgps.com/events/186557-a-template', 'https://ridewithgps.com/events/186557-a-template']);
        events.forEach((event, i) => {
            console.log(`Event[${i}] name:`, event.name);
            console.log(`Event[${i}] description:`, event.desc);
            console.log(`Event[${i}] slug:`, event.slug);
        });
    } catch (error) {
        console.error('get_events() error:', error);
    }
}

function test_copy_template() {
    console.log('\n--- Test: copy_template() ---');
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    const ATemplate = 'https://ridewithgps.com/events/186557-a-template'
    try {
        const copyResp = rwgps.copy_template_(ATemplate);
        console.log('copy_template_ result is a Public Event URL:', copyResp);
       
    } catch (error) {
        console.error('copy_template_() error:', error);
    }
}
function test_batch_delete_events() {
    console.log('\n--- Test: batch_delete_events() ---');
    const { rwgpsService, rwgps, globals } = getRWGPSObjects_();
    try {
        const eventUrls = [rwgps.copy_template_('https://ridewithgps.com/events/186557-a-template'),
        rwgps.copy_template_('https://ridewithgps.com/events/186557-a-template')];
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

function getRWGPSObjects_() {
    const Globals = {


        RIDE_LEADER_TBD_NAME: 'To Be Determined',

        A_TEMPLATE: `https://ridewithgps.com/events/186557-a-template`,
        B_TEMPLATE: `https://ridewithgps.com/events/186234-b-template`,
        C_TEMPLATE: `https://ridewithgps.com/events/186235-c-template`,
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