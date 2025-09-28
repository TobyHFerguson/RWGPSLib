const A_TEMPLATE_URL = 'https://ridewithgps.com/events/404021-a-template'

function RWGPSServiceSmokeTest() {
    console.log('RWGPSServiceSmokeTest: RWGPSService instantiated successfully.');
    console.log('---- Starting RWGPSService smoke tests ----');
    // Run tests
    testGetRoute();
    // testDeleteRoute() - this gets executed in testImportRoute()
    testImportRoute();
    testCopyTemplate();
    // testDeleteEvent() - this gets executed in testCopyTemplate()
    testEditEvent();
    testBatchDeleteEvents();
    testBatchDeleteRoutes();
    testUntagEvents()
    testGetOrganizers();
    testGetAll();
    testGet();
    console.log('---- RWGPSService smoke tests completed ----');
}
function testDeleteRoute(id) {
    console.log('\n--- Test: deleteRoute() ---');
    const rwgpsService = getRWGPSService_();
    try {
        const deleteResp = rwgpsService.deleteRoute(id); // Use a non-existent route ID for safe testing
        console.log('deleteRoute called with apiService.getClubData()')
        console.log('deleteRoute response code:', deleteResp.getResponseCode());
    } catch (error) {
        console.error('deleteRoute() error:', error);
    }
}

function testImportRoute() {
    console.log('\n--- Test: importRoute() ---');
    const rwgpsService = getRWGPSService_();
    try {
        const importResp = rwgpsService.importRoute({
            url: 'https://ridewithgps.com/routes/19551869', visibility: 2, name: "Toby's Tagged route", expiry: '12/24/2022',
            tags: ['Tobys Tag'], fargle: 'wargle'  // Extra field to test robustness
        }); // Use a dummy route object for safe testing
        console.log('importRoute called with this.apiService.fetchUserData()');
        console.log('importRoute response code:', importResp.getResponseCode());
        console.log('importRoute() response id:', JSON.parse(importResp.getContentText()).id);
        testDeleteRoute(JSON.parse(importResp.getContentText()).url);
    } catch (error) {
        console.error('importRoute() error:', error);
        console.log('Skipping deleteRoute() test due to importRoute() failure.');
        return;
    }
}


function testGetRoute() {
    console.log('\n--- Test: getRoute() ---');
    const rwgpsService = getRWGPSService_();
    const url = 'https://ridewithgps.com/routes/49027962'; // Dummy route ID
    try {
        const getResp = rwgpsService.getRoute(url);
        console.log('getRoute called with apiService.getPublicData()');
        console.log('getRoute response code:', getResp.getResponseCode());
        console.log('getRoute() response:', JSON.parse(getResp.getContentText()).name);
    } catch (error) {
        console.error('getRoute() error:', error);
    }
}

function testCopyTemplate() {
    console.log('\n--- Test: copyTemplate() ---');
    const rwgpsService = getRWGPSService_();
    try {
        const copyResp = rwgpsService.copy_template_(A_TEMPLATE_URL);
        console.log('copy_template_ called with this.apiService.fetchUserData()');
        console.log('copy_template_ response code:', copyResp.getResponseCode());
        console.log('copy_template_() response:', copyResp.getContentText());
        console.log('copy_template_ response headers.Location:', copyResp.getAllHeaders().Location);
        testDeleteEvent(copyResp.getAllHeaders().Location)
    } catch (error) {
        console.error('copy_template_() error:', error);
    }
}

function testDeleteEvent(eventUrl) {
    console.log('\n--- Test: deleteEvent() ---');
    const rwgpsService = getRWGPSService_();
    try {
        const deleteResp = rwgpsService.deleteEvent(eventUrl);
        console.log('deleteEvent called with apiService.fetchClubData()');
        console.log('deleteEvent response code:', deleteResp.getResponseCode());
        console.log('deleteEvent() response:', deleteResp.getContentText());
    } catch (error) {
        console.error('deleteEvent() error:', error);
    }
}

function testEditEvent() {
    console.log('\n--- Test: edit_event() ---');
    const rwgpsService = getRWGPSService_();
    const response = rwgpsService.copy_template_(A_TEMPLATE_URL);
    const newEventUrl = response.getAllHeaders().Location;
    const newEvent = rwgpsService.getEvent(newEventUrl);
    newEvent.name = "Updated Event Name";
    newEvent.desc = "Updated description";

    const updatedEventResponse = rwgpsService.edit_event(newEventUrl, newEvent);
    console.log('edit_event called with this.apiService.fetchUserData()');
    console.log('edit_event response code:', updatedEventResponse.getResponseCode());
    console.log('edit_event() response:', updatedEventResponse.getContentText());
    testDeleteEvent(newEventUrl);
}

function testBatchDeleteEvents() {
    console.log('\n--- Test: batchDeleteEvents() ---');
    const rwgpsService = getRWGPSService_();
    try {
        const eventUrls = [rwgpsService.copy_template_(A_TEMPLATE_URL).getAllHeaders().Location,
        rwgpsService.copy_template_(A_TEMPLATE_URL).getAllHeaders().Location];
        const eventIds = eventUrls.map(url => rwgpsService.extractIdFromUrl(url));
        console.log('Event IDs to delete:', eventIds);
        const deleteResps = rwgpsService.batch_delete_events(eventIds);
        console.log('batch_delete_events called with this.apiService.fetchUserData()');
        console.log(`batch_delete_events code: ` + deleteResps.getResponseCode());
        console.log('batch_delete_events() response:', deleteResps.getContentText());
    } catch (error) {
        console.error('batch_delete_events() error:', error);
    }
}
function testBatchDeleteRoutes() {
    const rwgpsService = getRWGPSService_();
    console.log('\n--- Test: batchDeleteRoutes() ---');
    try {
        const routeUrls = [rwgpsService.importRoute({
            url: 'https://ridewithgps.com/routes/19551869', visibility: 2, name: "Toby's Tagged route", expiry: '12/24/2022',
            tags: ['Tobys Tag'], fargle: 'wargle'  // Extra field to test robustness
        }), rwgpsService.importRoute({
            url: 'https://ridewithgps.com/routes/19551869', visibility: 2, name: "Toby's Tagged route", expiry: '12/24/2022',
            tags: ['Tobys Tag'], fargle: 'wargle'  // Extra field to test robustness
        })].map(resp => JSON.parse(resp.getContentText()).url);
        console.log('Route URLs to delete:', routeUrls);
        const deleteResps = rwgpsService.batch_delete_routes(routeUrls);
        console.log('batch_delete_routes called with this.apiService.fetchUserData()');
        console.log(`batch_delete_routes code: ` + deleteResps.getResponseCode());
        console.log('batch_delete_routes() response:', deleteResps.getContentText());
    } catch (error) {
        console.error('batch_delete_routes() error:', error);
    }
}

function testUntagEvents() {
    const rwgpsService = getRWGPSService_();
    console.log('\n--- Test: untagEvents() ---');
    try {
        const eventUrls = [rwgpsService.copy_template_(A_TEMPLATE_URL).getAllHeaders().Location,
        rwgpsService.copy_template_(A_TEMPLATE_URL).getAllHeaders().Location];
        const eventIds = eventUrls.map(url => rwgpsService.extractIdFromUrl(url));
        console.log('Event IDs to untag:', eventIds);
        const untagResp = rwgpsService.unTagEvents(eventIds, ['template']);
        console.log('unTagEvents called with this.apiService.fetchUserData()');
        console.log(`unTagEvents code: ` + untagResp.getResponseCode());
        console.log('unTagEvents() response:', untagResp.getContentText());
        rwgpsService.batch_delete_events(eventIds);
    } catch (error) {
        console.error('unTagEvents() error:', error);
    }
}

function testGetOrganizers() {
    const rwgpsService = getRWGPSService_();
    console.log('\n--- Test: getOrganizers() ---');
    try {
        const organizersResp = rwgpsService.getOrganizers('https://ridewithgps.com/events/343514', 'Peter Stanger');
        console.log('getOrganizers called with this.apiService.fetchPublicData()');
        console.log(`getOrganizers code: ` + organizersResp.getResponseCode());
        console.log('getOrganizers() response:', organizersResp.getContentText());
    } catch (error) {
        console.error('getOrganizers() error:', error);
    }
}

function testGetAll() {
    console.log('\n--- Test: getAll() ---');
    const rwgpsService = getRWGPSService_();
    try {
        const urls = [
            'https://ridewithgps.com/events/341643.json',
            'https://ridewithgps.com/events/341643/participants.json',
            'https://ridewithgps.com/events/341643/organizer_ids.json'
        ];
        console.log('getAll called with this.apiService.fetchUserData()');
        const responses = rwgpsService.getAll(urls);
        responses.forEach((resp, i) => {
            console.log(`getAll[${i}] code: ` + resp.getResponseCode());
            console.log(`getAll[${i}] response: ` + resp.getContentText());
        });
    } catch (error) {
        console.error('getAll() error:', error);
    }
}

function testGet() {
    console.log('\n--- Test: get() ---');
    const rwgpsService = getRWGPSService_();
    console.log('get call with this.apiService.fetchPublicData')
    const response = rwgpsService.get('https://ridewithgps.com/')
    console.log('rwgpsService.get() response code:', response.getResponseCode());
    console.log('rwgpsService.get() response text:', response.getContentText().substring(0, 200)); // Log first 200 chars       
}
function getRWGPSService_() {
    const globals = { CANONICAL_EVENT: '' };
    const credentialManager = new CredentialManager(PropertiesService.getScriptProperties());
    const rwgpsService = newRWGPSService(globals, credentialManager);
    return rwgpsService;
}