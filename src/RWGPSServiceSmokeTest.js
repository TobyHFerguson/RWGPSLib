function RWGPSServiceSmokeTest() {
    const globals = { CANONICAL_EVENT: '' };
    const credentialManager = new CredentialManager(PropertiesService.getScriptProperties());
    const rwgpsService = newRWGPSService(globals, credentialManager);

    console.log('RWGPSServiceSmokeTest: RWGPSService instantiated successfully.');
    console.log('---- Starting RWGPSService smoke tests ----');
    function testDeleteRoute(id) {
        console.log('\n--- Test: deleteRoute() ---');
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
        try {
            const importResp = rwgpsService.importRoute({
                url: 'https://ridewithgps.com/routes/19551869', visibility: 2, name: "Toby's Tagged route", expiry: '12/24/2022',
                tags: ['Tobys Tag'], fargle: 'wargle'  // Extra field to test robustness
            }); // Use a dummy route object for safe testing
            console.log('importRoute called with this.apiService.fetchUserData()');
            console.log('importRoute response code:', importResp.getResponseCode());
            console.log('importRoute() response id:', JSON.parse(importResp.getContentText()).id);
            testDeleteRoute(JSON.parse(importResp.getContentText()).id);
        } catch (error) {
            console.error('importRoute() error:', error);
            console.log('Skipping deleteRoute() test due to importRoute() failure.');
            return;
        }
    }


    function testGetRoute() {
        console.log('\n--- Test: getRoute() ---');
        const id = 49027962; // Dummy route ID
        try {
            const getResp = rwgpsService.getRoute(id);
            console.log('getRoute called with apiService.getPublicData()');
            console.log('getRoute response code:', getResp.getResponseCode());
            console.log('getRoute() response:', JSON.parse(getResp.getContentText()).name);
        } catch (error) {
            console.error('getRoute() error:', error);
        }
    }

    function testCopyTemplate() {
        console.log('\n--- Test: copyTemplate() ---');
        const ATemplate = 'https://ridewithgps.com/events/186557-a-template'
        try {
            const copyResp = rwgpsService.copy_template_(ATemplate);
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
        const response = rwgpsService.copy_template_('https://ridewithgps.com/events/186557-a-template');
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
        try {
            const eventUrls = [rwgpsService.copy_template_('https://ridewithgps.com/events/186557-a-template').getAllHeaders().Location,
            rwgpsService.copy_template_('https://ridewithgps.com/events/186557-a-template').getAllHeaders().Location];
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
    // testGetRoute();
    // // testDeleteRoute() - this gets executed in testImportRoute()
    // testImportRoute();
    // testCopyTemplate();
    // // testDeleteEvent() - this gets executed in testCopyTemplate()
    // testEditEvent();
    testBatchDeleteEvents();
    console.log('---- RWGPSService smoke tests completed ----');
}