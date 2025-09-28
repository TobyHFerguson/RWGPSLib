class RWGPSService {
    constructor(apiService, globals) {
        this.apiService = apiService;
        this.globals = globals;
        this.apiService.login();
    }
    /**
     * 
     * @param {string} url 
     * @param {*} options 
     * @returns {HttpResponse} 
     */
    _send_request(url, options) {
        if (!url || url.length === 0) {
            throw new Error('URL is required');
        }
        options.headers = { ...options.headers, 'cookie': this.apiService.webSessionCookie };
        console.log('Sending request to URL:', url);
        console.log('With options:', options);
        const response = UrlFetchApp.fetch(url, options);
        return response;
    }
    /**
     * Get a single route by ID
     * @param {PublicRouteUrl} url - the ID of the route to retrieve
     * @returns {object} the response object
     */
    getRoute(url) {
        if (!this.isPublicRouteUrl(url)) {
            throw new Error(`Invalid public route URL: ${url}`);
        }
        const options = {
            headers: {
                Accept: "application/json" // Note use of Accept header - returns a 404 otherwise. 
            }
        }
        return this.apiService.fetchPublicData(url, options);
    }
    /**
     * Delete a single route by url
     * @param {PublicRouteUrl} url - the public route URL to delete
     * @returns {object} the response object
     */
    deleteRoute(url) {
        if (!this.isPublicRouteUrl(url)) {
            throw new Error('Route URL is required');
        }
        const id = this.extractIdFromUrl(url);
        const routeUrl = `https://ridewithgps.com/api/v1/routes/${id}.json`;
        const options = {
            method: 'delete',
            followRedirects: false,
            muteHttpExceptions: false
        }
        return this.apiService.fetchClubData(routeUrl, options);
    }
    /**
     * Import a foreign route
     * @param {ForeignRoute} routeObject - the foreign route object to be imported
     */
    importRoute(routeObject) {
        if (!routeObject) {
            throw new Error('Route object is required');
        } else if (!routeObject.url || !this.isPublicRouteUrl(routeObject.url)) {
            throw new Error(`Invalid foreign route URL: ${routeObject.url}`);
        }
        const url = routeObject.url + "/copy.json";
        const payload = {
            "user_id": 621846, // SCCCC user
            "asset_type": "route",
            "privacy_code": null,
            "include_photos": false,
            ...routeObject
        }
        const options = {
            payload: payload
        }
        return this.apiService.fetchUserData(url, options);
    }
    /**
     * Extract ID from a RWGPS URL
     * @param {string} url - URL like "https://ridewithgps.com/events/403834-copied-event"
     * @return {string} the ID extracted from the URL (e.g., "403834")
     */
    extractIdFromUrl(url) {
        if (!url || url.length === 0) {
            throw new Error('URL is required');
        }
        const match = url.match(/\/(\d+)(-|$)/);
        return match ? match[1] : null;
    }

    /**
     * Check if a URL is a public route URL
     * @param {string} url - the URL to check
     * @returns {boolean} true if the URL is a public route URL, false otherwise
     */
    isPublicRouteUrl(url) {
        if (!url || url.length === 0) {
            throw new Error('URL is required');
        }
        const publicRoutePattern = /^https:\/\/ridewithgps\.com\/routes\/\d+$/;
        return publicRoutePattern.test(url);
    }

    /**
     * Check if a URL is a public event URL
     * @param {string} url - the URL to check
     * @returns {boolean} true if the URL is a public event URL, false otherwise
     */
    isPublicEventUrl(url) {
        if (!url || url.length === 0) {
            throw new Error('URL is required');
        }
        const publicEventPattern = /^https:\/\/ridewithgps\.com\/events\/\d+[^/]*$/;
        return publicEventPattern.test(url);
    }

    /**
  * Select the keys and values of the left object where every key in the left is in the right
  * @param{left} object
  * @param{right} object
  * @return object - the new object created
  */
    key_filter(left, right) {
        if (!left || typeof left !== 'object') {
            throw new Error('Left object is required');
        }
        if (!right || typeof right !== 'object') {
            throw new Error('Right object is required');
        }
        let no = { ...left };
        let left_keys = Object.keys(no);
        let right_keys = Object.keys(right);
        left_keys.filter(k => !right_keys.includes(k)).forEach(k => delete no[k])
        return no;
    }

    /**
     * Copy an event template
     * @param {PublicEventUrl} template_url
     * @returns {HttpResponse} the response object
     * 
     * Note, the Location header of the response contains the URL of the new event
     */
    copy_template_(template_url) {
        if (!this.isPublicEventUrl(template_url)) {
            throw new Error(`Invalid public event URL: ${template_url}`);
        }
        // POST to https://ridewithgps.com/events/186557-a-template/copy
        // with form data:
        const url = template_url + "/copy"; // not JSON - need to get the html redirect
        const payload = {
            'event[name]': "COPIED EVENT",
            'event[all_day]': "0",
            'event[copy_routes]': "0",
            'event[start_date]': "",
            'event[start_time]': ""
        }
        const options = {
            payload: payload,
            followRedirects: false, // important to get the 302 redirect
        }
        return this.apiService.fetchUserData(url, options);
    }

    /**
     * Delete an event
     * @param {PublicEventUrl} event_url
     * @returns {HttpResponse} the response object
     */
    deleteEvent(event_url) {
        if (!this.isPublicEventUrl(event_url)) {
            throw new Error(`Invalid public event URL: ${event_url}`);
        }
        // DELETE to https://ridewithgps.com/api/v1/events/403834.json
        // where 403834 is the event ID extracted from the event_url
        const id = this.extractIdFromUrl(event_url);
        const url = `https://ridewithgps.com/api/v1/events/${id}.json`
        const options = {
            method: 'delete',
        }
        return this.apiService.fetchClubData(url, options);
    }
    /**
     * GET the given url
     * @param {string} url - the url whose resource is to be fetched
     * @returns {object} the response object
     */
    get(url) {
        return this.apiService.fetchPublicData(url);
    }

    /**
     * 
     * @param {PublicEventUrl} url - public event URL
     * @returns {Object} event object as per https://github.com/ridewithgps/developers/blob/master/endpoints/events.md#get-apiv1eventsidjson
     */
    getEvent(url) {
        if (!this.isPublicEventUrl(url)) {
            throw new Error(`Invalid public event URL: ${url}`);
        }
        const id = this.extractIdFromUrl(url);
        const event_url = `https://ridewithgps.com/api/v1/events/${id}.json`;
        return this.apiService.fetchClubData(event_url);
    }
    /**
     * Edit an event
     * @param {PublicEventUrl} event_url - the public URL of the event to be edited
     * @param {Event} event - the event object containing the updated details only
     * @returns {object} the response object
     */
    edit_event(event_url, event) {
        if (!this.isPublicEventUrl(event_url)) {
            throw new Error(`Invalid public event URL: ${event_url}`);
        }
        //TODO - validate event object
        let new_event = this.key_filter(event, CANONICAL_EVENT);
        const options = {
            method: 'put',
            contentType: 'application/json',
            payload: JSON.stringify(new_event),
            headers: {
                Accept: "application/json" // Note use of Accept header - returns a 404 otherwise. 
            },
            followRedirects: false,
            muteHttpExceptions: true
        }
        return this.apiService.fetchUserData(event_url, options);
    }

    /**
     * Delete multiple events
     * @param{string[]} event_ids - an array containing the ids of the events to delete
     * @returns {object} the response object which contains an array of the deleted events
     */
    //TODO - take an array of public event URLs
    batch_delete_events(event_ids) {
        let url = "https://ridewithgps.com/events/batch_destroy.json";
        const payload = { event_ids: event_ids.join() }
        const options = {
            payload: payload
        }
        return this.apiService.fetchUserData(url, options);
    }

    /**
     * Delete multiple routes
     * @param {PublicRouteUrl[]} route_urls - an array containing the ids of the routes to delete
     * @returns {HttpResponse} the response object which contains an array of the deleted routes
     */
    //TODO - take an array of public route URLs
    batch_delete_routes(route_urls) {
        if (!Array.isArray(route_urls) || route_urls.length === 0) {
            throw new Error('Invalid route URLs');
        }
        const route_ids = route_urls.map(url => this.extractIdFromUrl(url));
        let url = "https://ridewithgps.com/routes/batch_destroy.json";
        const payload = { route_ids: route_ids.join(',') }
        const options = {
            payload: payload
        }
        return this.apiService.fetchUserData(url, options);
    }
    /**
     * Update multiple tags on multiple resources
     * @param{!(NumberLike | NumberLike[])} ids - an id or an array of ids of the resources to be tagged
     * @param{!(string | string[])} tags - an optional tag or array of tags
     * @param{!string} tag_action - one of 'add' or 'remove' to indicate addition or removal of tags
     * @param{!string} resource - the kind of resource to be operated on, one of 'event' or 'route'
    */
    _batch_update_tags(ids, tag_action, tags, resource) {
        if (ids.length > 0 && tags.length > 0) {
            const url = `https://ridewithgps.com/${resource}s/batch_update_tags.json`;
            const payload = { tag_action, tag_names: tags.join() };
            payload[`${resource}_ids`] = ids.join();
            const options = {
                payload: payload
            }
            return this.apiService.fetchUserData(url, options);
        }
    }

    /**
     * Add multiple tags to multiple events - idempotent
     * @param{NumberLike[]} ids - an array containing the ids of the events to add the tags to
     * @param{string[]} tags - an array of the tags to be added to the events
     */
    tagEvents(ids, tags) {
        return this._batch_update_tags(ids, "add", tags, 'event');
    }

    /**
     * remove multiple tags from multiple events - idempotent
     * @param{NumberLike[]} ids - an array containing the ids of the events to remove the tags from
     * @param{string[]} tags - an array of the tags to be removed from the events
     */
    unTagEvents(ids, tags) {
        return this._batch_update_tags(ids, "remove", tags, 'event');
    }

    /**
      * Add multiple tags to multiple routes - idempotent
      * @param{NumberLike[]} ids - an array containing the ids of the routes to add the tags to
      * @param{string[]} tags - an array of the tags to be added to the routes
      */
    tagRoutes(ids, tags) {
        return this._batch_update_tags(ids, "add", tags, 'route');
    }

    /**
    * Remove multiple tags from multiple routes - idempotent
    * @param{NumberLike[]} ids - an array containing the ids of the routes to add the tags to
    * @param{string[]} tags - an array of the tags to be removed from the routes
    */
    unTagRoutes(route_ids, tags) {
        return this._batch_update_tags(route_ids, "remove", tags, 'route');
    }

    /**
     * Get organizer IDs for a specific event
     * @param {PublicEventUrl} url public event URL
     * @param {string} organizer_name 
     * @returns 
     */
    //TODO - use the private table mechanism to get all users in one go.
    //TODO: get rid of organizer_name - not needed.
    getOrganizers(url, organizer_name) {
        if (!this.isPublicEventUrl(url)) {
            throw new Error(`Invalid public event URL: ${url}`);
        }
        if (!organizer_name || organizer_name.length === 0) {
            throw new Error('Organizer name is required');
        }
        url = `${url}/organizer_ids.json`;
        const payload = { term: organizer_name.split(' ')[0], page: 1 }
        const options = {
            payload: payload
        }
        return this.apiService.fetchUserData(url, options);
    }

    /**
     * Get all events or routes
     * @param {string[]} urls - an array of public event or route URLs
     * @param {*} override - optional override parameters
     * @returns {HttpResponse[]} - an array of response objects
     */
    getAll(urls, override = {}) {
        if (!Array.isArray(urls) || urls.length === 0) {
            throw new Error('urls must be a non-empty array');
        }
        const requests = urls.map(url => {
            let r = {
                url,
                headers: {
                    Accept: "application/json" // Note use of Accept header - returns a 404 otherwise. 
                },
                ...override
            };
            return r;
        })
        console.log('Requests are:', requests);
        return this.apiService.fetchUserData(requests);
    }

    /**
     * Edit multiple events
     * @param {EventEditObject[]} eventEditObjects - an array of event edit objects
     * @returns {HttpResponse} - a promise that resolves when all events have been edited
     */
    edit_events(eventEditObjects) {
        if (!Array.isArray(eventEditObjects) || eventEditObjects.length === 0) {
            throw new Error('eventEditObjects must be a non-empty array');
        }
        const self = this;
        function createRequest(eventEditObject) {
            let new_event = self.key_filter(eventEditObject.event, CANONICAL_EVENT);
            const request = {
                url: eventEditObject.url,
                method: 'put',
                contentType: 'application/json',
                payload: JSON.stringify(new_event),
                headers: {
                    Accept: "application/json" // Note use of Accept header - returns a 404 otherwise. 
                },
                followRedirects: false,
                muteHttpExceptions: true
            }
            return request;
        }
        const requests = eventEditObjects.map(eeo => createRequest(eeo));
        const responses = this.apiService.fetchUserData(requests);
        return responses;
    }
}

