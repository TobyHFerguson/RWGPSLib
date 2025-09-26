class RWGPSService {
    constructor(apiService, globals) {
        this.apiService = apiService;
        this.globals = globals;
        this.apiService.login();
    }
    /**
     * 
     * @param {ForeignRoute} routeObject - the foreign route object to be imported
     * @return {string} the url of the imported route
     */
    importRoute(routeObject) {
        const url = routeObject.url + "/copy.json";
        const payload = {
            "user_id": 621846, // SCCCC user
            "asset_type": "route",
            "privacy_code": null,
            "include_photos": false,
            ...routeObject
        }
        const options = {
            method: 'post',
            headers: {
                cookie: this.cookie,
                Accept: 'application/json'
            },
            followRedirects: false,
            muteHttpExceptions: false,
            payload: payload
        }
        return this.apiService.fetchUserData(url, options);
    }
    /**
  * Select the keys and values of the left object where every key in the left is in the right
  * @param{left} object
  * @param{right} object
  * @return object - the new object created
  */
    key_filter(left, right) {
        let no = { ...left };
        let left_keys = Object.keys(no);
        let right_keys = Object.keys(right);
        left_keys.filter(k => !right_keys.includes(k)).forEach(k => delete no[k])
        return no;
    }



    copy_template_(template_url) {
        const url = template_url + "/copy";
        const payload = {
            'event[name]': "COPIED EVENT",
            'event[all_day]': "0",
            'event[copy_routes]': "0",
            'event[start_date]': "",
            'event[start_time]': ""
        }
        const options = {
            method: 'post',
            headers: { 'cookie': this.cookie },
            followRedirects: false,
            muteHttpExceptions: false,
            payload: payload
        }
        return this.apiService.fetchUserData(url, options);
    }

    /**
     * GET the given url
     * @param {string} url - the url whose resource is to be fetched
     * @returns {object} the response object
     */
    get(url) {
        return this.apiService.fetchPublicData(url, options);
    }

    edit_event(event_url, event) {
        let new_event = this.key_filter(event, CANONICAL_EVENT);
        const options = {
            method: 'put',
            contentType: 'application/json',
            payload: JSON.stringify(new_event),
            headers: {
                cookie: this.cookie,
                Accept: "application/json" // Note use of Accept header - returns a 404 otherwise. 
            },
            followRedirects: false,
            muteHttpExceptions: true
        }
        return this.apiService.fetchUserData(event_url, options);
    }
    round_trip(event_url, event) {
        const options = {
            method: 'put',
            contentType: 'application/json',
            payload: JSON.stringify(event),
            headers: {
                cookie: this.cookie,
                Accept: "application/json" // Note use of Accept header - returns a 404 otherwise. 
            },
            followRedirects: false,
            muteHttpExceptions: false
        }
        return this.apiService.fetchUserData(event_url, options);
    }

    /**
     * Delete multiple events
     * @param{string[]} event_ids - an array containing the ids of the events to delete
     */
    batch_delete_events(event_ids) {
        let url = "https://ridewithgps.com/events/batch_destroy.json";
        const payload = { event_ids: event_ids.join() }
        const options = {
            method: 'post',
            headers: { 'cookie': this.cookie },
            followRedirects: false,
            payload: payload
        }
        return this.apiService.fetchUserData(url, options);
    }

    /**
     * Delete multiple routes
     * @param{string[]} route_ids - an array containing the ids of the routes to delete
     */
    batch_delete_routes(route_ids) {
        let url = "https://ridewithgps.com/routes/batch_destroy.json";
        const payload = { route_ids: route_ids.join(',') }
        const options = {
            method: 'post',
            headers: { 'cookie': this.cookie },
            followRedirects: false,
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
                method: 'post',
                headers: { 'cookie': this.cookie },
                followRedirects: false,
                payload: payload
            }
            return this.apiService.fetchUserData(url, options);
        }
    }

    /**
   * A number, or a string containing a number.
   * @typedef {(number|string)} NumberLike
   */
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

    getOrganizers(url, organizer_name) {
        url = `${url}/organizer_ids.json`;
        const payload = { term: organizer_name.split(' ')[0], page: 1 }
        const options = {
            method: 'post',
            headers: { 'cookie': this.cookie },
            followRedirects: false,
            payload: payload
        }
        return this.apiService.fetchUserData(url, options);
    }

    getAll(urls, override = {}) {
        const requests = urls.map(url => {
            let r = {
                url,
                method: 'get',
                headers: {
                    // cookie: this.apiService.webSessionCookie,
                    Accept: "application/json",
                },
                followRedirects: false,
                muteHttpExceptions: false,
                ...override
            };
            return r;
        })
        console.log('Requests are:', requests);
        return this.apiService.fetchUserData(requests);
        // return UrlFetchApp.fetchAll(requests);
    }

    edit_events(eventEditObjects) {
        const self = this;
        function createRequest(eventEditObject) {
            let new_event = self.key_filter(eventEditObject.event, CANONICAL_EVENT);
            const request = {
                url: eventEditObject.url,
                method: 'put',
                contentType: 'application/json',
                payload: JSON.stringify(new_event),
                headers: {
                    cookie: self.cookie,
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