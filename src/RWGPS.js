function DEBUG_(message) {
  Logger.log(`DEBUG: ${message}`);
}

function newRWGPSService(email, password, globals) {
  return new RWGPSService(email, password, globals)
}

function newRWGPS(rwgpsService) {
  return new RWGPS(rwgpsService);
}

/**
 * Class RWGPS represents the services that are obtained by using event urls
 */
class RWGPS {
  constructor(rwgpsService) {
    this.globals = rwgpsService.globals;
    this.rwgpsService = rwgpsService;
  }
  /**
   * get the RSVP Object given an event id
   * @param {number} event_id the id of the event
   * @returns {RSVPObject} the rsvp object that represents this event's participants
   */
  getRSVPObject(event_id) {
    if (!event_id) {
      console.log(`RWGPS.getRSVPObject(${event_id}) with no event_id`)
      return { name: 'No event id given', participants: [] }
    }
    if (isNaN(event_id)) {
      console.log(`RWGPS.getRSVPObject(${event_id}) has been called with a non-number argument`);
      return { name: `I was expecting a numeric event id but got this: ${event_id}`, participants: [] }
    }
    try {
      return this.getRSVPObjectByURL(this.globals.EVENTS_URI + event_id)
    } catch (e) {
      Logger.log(e)
      return { name: `No such event: ${event_id}`, participants: [] }
    }
  }
  /**
   * @typedef {Object} Participant
   * @param {String} first_name
   * @param {String} last_name
   * @param {boolean} [leader] true iff this participant is a leader for the containing event
   */
  /**
   * @typedef {Object} RSVPObject
   * @property {String} name name of the event
   * @property {Participant[]} participants
   */
  /**
   * Get the RSVP Object that corresponds to the event at the given url
   * @param {URL} e_url Url of an event
   * @returns {RSVPObject} the rsvp object that represents the given event
   */
  getRSVPObjectByURL(e_url) {
    const globals = this.globals;
    function getEventName(response) {
      if (response.getResponseCode() !== 200) {
        console.log(`Response code: ${response.getResponseCode()} body: ${response.getContentText()}`)
        return "No event found"
      }
      return JSON.parse(response.getContentText())["event"]["name"]
    }
    function getParticipants(response) {
      if (response.getResponseCode() !== 200) {
        console.log(`Response code: ${response.getResponseCode()} body: ${response.getContentText()}`)
        return []
      }
      const body = response.getContentText();
      const json = JSON.parse(body);
      return json.filter(p => 
        (p.rsvp_status.toLowerCase() === "yes") && (p.first_name || p.last_name)
      )
    }
    /**
     * @typedef {Object} Organizer
     * @param{number} id
     * @param{string} text
     */
    /**
     * 
     * @param {*} response 
     * @returns {Organizer[]}
     */
    function getLeaders(response) {
      if (response.getResponseCode() !== 200) {
        Logger.log(`Response code: ${response.getResponseCode()} body: ${response.getContentText()}`)
        return []
      }
      const body = response.getContentText();
      const json = JSON.parse(body);
      return json.filter(o => o.id !== globals.RIDE_LEADER_TBD_ID).map(o => {
        const n = o.text.trim().split(/\s+/)
        return { user_id: o.id, first_name: n[0], last_name: n.length > 1 ? n[1] : '', leader: true }
      })
    }
    function compareParticipants(l, r) {
      function flatten(p) {
        function z(v) { return v ? v : 'zzzzz'}
        let f = z(p.last_name) + z(p.first_name)
          return f.toLowerCase();
      }
      
      const a = flatten(l)
      const b = flatten(r)
      const result = a < b ? -1 : a > b ? 1 : 0
      return result;
    }
    const p_url = e_url + "/participants.json";
    const o_url = e_url + "/organizer_ids.json";
    let responses;
    try {
      responses = this.rwgpsService.getAll([e_url, p_url, o_url], { muteHttpExceptions: false })
      let participants = getParticipants(responses[1]);
      const leaders = getLeaders(responses[2]);
      participants.forEach(p => {
        const li = leaders.findIndex(l => {
          return l.user_id === p.user_id;
        });
        if (li !== -1) {
          p.leader = true;
          leaders.splice(li, 1)
        }
      })
      participants = [...participants, ...leaders].toSorted(compareParticipants)

      const rsvpObject = {
        name: getEventName(responses[0]),
        participants: participants
      }
      return rsvpObject
    }
    catch (e) {
      console.warn(`${e.message} - original URL: ${e_url}`)
      return { name: "No Event Found", participants: [] }
    }
  }


  /**
   * Return the counts for each of the given event urls.
   * A count of 0 is given for any url that throws an error, and a log message is recorded.
   * @param {string[]} event_urls 
   * @param{string[]} rideLeaders - array of array of ride leader names, corresponding to the event_urls
   * @returns{Number[]} the counts, in the same order as the corresponding event url.
   */
  getRSVPCounts(event_urls, rideLeaders) {
    if (!event_urls || event_urls.length === 0) {
      return [0]
    }
    return event_urls.map(u => this.getRSVPObjectByURL(u).participants.length)
  }

  /**
   * Returns the basic url of the event created by coping the given template
   * @param {string} template_url - url of the RWGPS template to be copied
   * @returns the url of the copied event ending in digits
   */
  copy_template_(template_url) {
    let response = this.rwgpsService.copy_template_(template_url);
    const headers = response.getAllHeaders();
    return headers['Location'].split('-')[0];
  }
  /**
   * Get the event at the URL
   * @param{string} event_url
   * @returns{object} the event object
   */
  get_event(event_url) {
    let response = this.rwgpsService.getAll([event_url]);
    return JSON.parse(response[0].getContentText())["event"];
  }

  /**
   * Get the events at the given URLs. 
   * @param{string[]} event_urls
   * @return{Event[]} events at the given urls
   * 
   * For each url that results in an error the event will be undefined.
   */
  get_events(event_urls) {
    const responses = this.rwgpsService.getAll(event_urls);
    const events = responses.map((r, i) => {
      const text = r.getContentText();
      const body = JSON.parse(r.getContentText());
      if (r.getResponseCode() !== 200) {
        console.log(`RWGPS.get_events: Error (${r.getResponseCode()}) getting ${event_urls[i]}: ${text}`);
      }
      const event = body["event"];
      return event;
    });
    return events;
  }
  /**
   * Edit the scheduled event at the given url to be consistent with the given event object
   * @param{event_url} string - the scheduled event to be modified
   * @param{event} event object - the event to be used as the source of the changes
   */
  edit_event(event_url, event) {
    // RWGPS bug that prevents an event from being properly scheduled if all_day is not set.
    let new_event = { ...event, all_day: "1" }
    let response = this.rwgpsService.edit_event(event_url, new_event);
    response = this.rwgpsService.edit_event(event_url, event);
    if (response.getResponseCode() !== 200) {
      throw Error(`received a code ${response.getResponseCode()} when editing event ${event_url}`);
    }
    return response;
  }

  /**
   * @typedef EventEditObject
   * @prop{string} url - an event url
   * @prop{Event} event - an Event
   */

  /**
   * Edit the events as defined by the list of eventEditObjects
   * @param {EventEditObject[]} eventEditObjects 
   * @returns the resulting events
   */
  edit_events(eventEditObjects) {
    // These next two lines are to work around an RWGPS bug
    const eeos = eventEditObjects.map(({ event, url }) => { return { event: { ...event, all_day: "1" }, url } });
    this.edit_events_(eeos);

    const events = this.edit_events_(eventEditObjects);
    return events;
  }
  edit_events_(eventEditObjects) {
    const responses = this.rwgpsService.edit_events(eventEditObjects);
    const events = responses.map(response => response["event"]);
    return events;
  }
  /**
   * 
   * @param {URL[]} event_urls event urls to be deleted
   * @returns response from rwgps
   * @throws Exception if there's an error
   */
  batch_delete_events(event_urls) {
    let event_ids = event_urls.map(e => e.split('/')[4].split('-')[0]);
    return this.rwgpsService.batch_delete_events(event_ids);
  }
  /**
     * 
     * @param {URL[]} route_urls route urls to be deleted
     * @returns response from rwgps
     * @throws Exception if there's an error
     */
  batch_delete_routes(route_urls) {
    let event_ids = route_urls.map(e => e.split('/')[4].split('-')[0]);
    return this.rwgpsService.batch_delete_routes(event_ids);
  }

  /**
   * Add the tags to the events. Both arrays must be non-empty. Idempotent.
   * @param {string[]} event_urls - the array of event urls
   * @param {string[]} tags - the tags
   * @returns 
   */
  tagEvents(event_urls, tags) {
    let event_ids = event_urls.map(e => e.split('/')[4].split('-')[0]);
    return this.rwgpsService.tagEvents(event_ids, tags);
  }
  /**
   * Remove the tags from the events. Both arrays must be non-empty. Idempotent.
   * @param {string[]} event_urls - the event urls
   * @param {string[]} tags - the tags
   */
  unTagEvents(event_urls, tags) {
    let event_ids = event_urls.map(e => e.split('/')[4].split('-')[0]);
    this.rwgpsService.unTagEvents(event_ids, tags);
  }

  /**
   * The Organizer (i.e. ride leader) of an event
   * @typedef Organizer 
   * @property {string} id the organizer id
   * @property {string} text the organizer's name
   */
  /**
     * 
     * @param {string[]} names - list of ride leader names
     * @param {RWGPS} rwgps - rwgps object to lookup organizers with
     * @returns {Organizer[]} one or more organizer objects
     */
  getOrganizers(names) {
    if (!names) return [];
    //convert the names into the organizer structure
    const organizers = names.map(name => this.lookupOrganizer(this.globals.A_TEMPLATE, name.trim()));
    //Figure out if any of the names are known
    const knownOrganizers = organizers.filter(o => o.id !== this.globals.RIDE_LEADER_TBD_ID)
    //If any names are known then return them, else return the TBD organizer
    return (knownOrganizers.length ? knownOrganizers : { id: this.globals.RIDE_LEADER_TBD_ID, text: this.globals.RIDE_LEADER_TBD_NAME });
  }
  /**
   * lookup the organizer id given an event url and the organizer name
   * @param{url} string - the event url
   * @param{name} string - the organizer's name
   * @return{string} - the organizer's id
   */
  lookupOrganizer(url, organizer_name) {
    let TBD = { text: this.globals.RIDE_LEADER_TBD_NAME, id: this.globals.RIDE_LEADER_TBD_ID };
    if (!organizer_name) {
      return TBD;
    }
    // Make a string that can be easily and accurately compared - lowercase, all strings prefix, infix, suffix removed
    const on_lc = organizer_name.toLowerCase().split(' ').join('');
    const response = this.rwgpsService.getOrganizers(url, organizer_name);
    const rc = response.getResponseCode();
    if (rc == 200 || rc == 404) {
      try {
        const content = JSON.parse(response.getContentText());
        const names = content.results;
        let found = names.find(n => n.text.toLowerCase().split(' ').join('') === on_lc);
        if (!found) {
          found = { text: organizer_name, id: this.globals.RIDE_LEADER_TBD_ID }
        }
        return found;
      } catch (e) {
        Logger.log(`RWGPS.lookupOrganizer(${url}, ${organizer_name}) threw ${e}`);
        Logger.log(`RWGPS.lookupOrganizer(${url}, ${organizer_name}) content text: ${response.getContentText()}`);
        throw (e);
      }
    }
    return TBD;
  }

  /**
 * Determine if named ride leader is known
 * @param {string} name first and last name of ride leader whose status is to be determined
 * @return {boolean} true iff the ride leader is not the default
 */
  knownRideLeader(name) {
    return this.lookupOrganizer(this.globals.A_TEMPLATE, name).id !== this.globals.RIDE_LEADER_TBD_ID;
  }

  /**
   * @typedef Route
   * @type {Object}
   * @property {string} url - the foreign route's url
   * @property {Number} [visibility = 0] - the visibility to set the imported route to. Defaults to 0 (Public)
   * @property {string} [name] - the name of the imported route. Defaults to the foreign route's name.
   * @property {Date} [expiry] - date that the imported route should be expired.
   * @property {string[]} [tags] - tags to be added to the imported route
   */
  /**
   * Import a route from a foreign route URL into the club library
   * @param {Route} route - the foreign route url or object
   * @returns {string} url - the url of the new route in the club library
   * @throws Exception if the import fails for any reason.
   */
  importRoute(route) {
    let fr;
    if (typeof route === typeof "") {
      fr = { url: route }
    } else {
      fr = route;
    }

    const response = this.rwgpsService.importRoute(fr);
    const body = JSON.parse(response.getContentText());
    if (body.success) {
      let localRoute = { ...fr, url: body.url }
      this.setRouteExpiration(localRoute);
    }
    return body.url;
  }
  /**
   * Return the object at the given route url
   * @param {string} route_url - url of route to be fetched
   */
  getRouteObject(route_url) {
    const response = this.rwgpsService.get(route_url);
    const o = JSON.parse(response.getContentText());
    return o;
  }

  /**
   * Set the expiration date of the given route to the latter of the route's current expiration date or its new one
   * @param {Route} localRoute - the url of the route whose expiration is to be set
   * @param {NumberLike} [extend_only = false] - When true only update the expiration if there's already an expiration date. If there's not then do nothing. When false then add the expiration regardless.
   * @returns {object} returns this for chaining
   */
  setRouteExpiration(localRoute, extend_only = false) {
    if (!localRoute.url) {
      return this;
    }
    const self = this;
    function findExpirationTag(route_url) {
      const route = self.getRouteObject(route_url);
      if (route.tag_names) {
        const ix = route.tag_names.findIndex(element => element.startsWith("expires: "));
        return route.tag_names[ix]
      }
    }
    function deleteExpirationTag(route_url) {
      const etag = findExpirationTag(route_url);
      if (etag) {
        const id = route_url.split('/')[4].split('-')[0];
        self.rwgpsService.unTagRoutes([id], [etag]);
      }
    }
    function getExpirationDate(etag) {
      return etag.split(": ")[1];
    }
    function makeExpirationTag(date) {
      return `expires: ${dates.MMDDYYYY(date)}`
    }
    if (!localRoute.expiry) {
      deleteExpirationTag(localRoute.url);
    } else {
      localRoute.tags = [...(localRoute.tags || [])]
      localRoute.tags.push(makeExpirationTag(localRoute.expiry));
      // cet: Current Expiration Tag
      const cet = findExpirationTag(localRoute.url);
      if (!cet) { // No expiration tag
        if (extend_only) {
          // no-op! We've not got an expiration date but we've been told only to extend!
        } else {
          // No expiration date, but we're not extending, so add a new tag
          const id = localRoute.url.split('/')[4].split('-')[0];
          this.rwgpsService.tagRoutes([id], localRoute.tags);
        }
      } else {
        // we have an expiration tag; extend_only doesn't matter here; We'll replace the tag.
        const ced = getExpirationDate(cet);
        if (dates.compare(ced, localRoute.expiry) < 0) {
          const id = route_url.split('/')[4].split('-')[0];
          this.rwgpsService.unTagRoutes([id], [cet]);
          this.rwgpsService.tagRoutes([id], localRoute.tags);
        }
      }
    }
    return this;
  }
}


/**
 * This is the event I've gleaned from a working session with Chrome. It contains every property I might wish to set. 
 * Only properties from this event should be sent to RWGPS - not sure that it actually matters, but when debugging its
 * one of the things the engineers wanted to ensure. 
 */
const CANONICAL_EVENT = {
  "id": 188822,
  "name": "My New Name",
  "desc": "This is the description",
  "group_id": 5278668,
  "group_membership_id": 642972,
  "created_at": "2022-08-02T15:24:30-07:00",
  "updated_at": "2022-08-02T15:24:30-07:00",
  "official": false,
  "starts_on": null,
  "custom_tabs": "[]",
  "location": "Aptos Village",
  "slug": "188822-copied-event",
  "ends_on": null,
  "cost_in_cents": null,
  "visibility": "1",
  "starts_at": null,
  "ends_at": null,
  "request_age_and_gender": "0",
  "filter_gender": "1",
  "filter_age": "1",
  "age_splits": "35,55",
  "participant_duration": null,
  "request_email": "0",
  "organizer_ids": [
    []
  ],
  "event_series_id": null,
  "archived_at": null,
  "all_day": "0",
  "implicit_ends_at": null,
  "organizer_names_formal": [],
  "user": {
    "id": 621846,
    "name": "Santa Cruz County Cycling Club"
  },
  "creating_group": {
    "name": "",
    "visibility": 0,
    "slug": null
  },
  "start_date": "2022-08-31",
  "start_time": "",
  "end_date": "",
  "end_time": "",
  "repeat_frequency": "does not repeat",
  "weekly_repeat_every": "1",
  "weekly_repeat_until": "2022-09-02",
  "monthly_repeat_every": "0",
  "monthly_repeat_on": "0",
  "monthly_repeat_until": "2022-09-02",
  "organizer_tokens": "302732",
  "auto_expire_participants": "0",
  "route_ids": ""
}


class RWGPSService {
  constructor(email, password, globals) {
    this.globals = globals;
    this.sign_in(email, password);
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
    return this._send_request(url, options);
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

  _send_request(url, options) {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getAllHeaders()['Set-Cookie'] !== undefined) {
      const newCookie = response.getAllHeaders()['Set-Cookie'].split(';')[0];
      this.cookie = newCookie;
    }
    return response;
  }
  sign_in(email, password, globals) {
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'user-email': email,
        'user-password': password
      },
      followRedirects: false
    };
    let response = this._send_request(this.globals.SIGN_IN_URI, options);
    if (response.getResponseCode() == 302 && response.getAllHeaders()["Location"] === "https://ridewithgps.com/signup") {
      throw new Error("Could not sign in - invalid credentials for RWGPS");
    }
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
    return this._send_request(url, options);
  }

  /**
   * GET the given url
   * @param {string} url - the url whose resource is to be fetched
   * @returns {object} the response object
   */
  get(url) {
    const options = {
      method: 'get',
      headers: {
        cookie: this.cookie,
        Accept: "application/json" // Note use of Accept header - returns a 404 otherwise. 
      },
      followRedirects: false,
      muteHttpExceptions: false
    }
    return this._send_request(url, options);
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
    return this._send_request(event_url, options);
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
    return this._send_request(event_url, options);
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
    return this._send_request(url, options);
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
    return this._send_request(url, options);
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
      return this._send_request(url, options);
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
    return this._send_request(url, options);
  }

  getAll(urls, override = {}) {
    const requests = urls.map(url => {
      let r = {
        url,
        method: 'get',
        headers: {
          cookie: this.cookie,
          Accept: "application/json" // Note use of Accept header - returns a 404 otherwise. 
        },
        followRedirects: false,
        muteHttpExceptions: false,
        ...override
      };
      return r;
    })
    return UrlFetchApp.fetchAll(requests);
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
    const responses = UrlFetchApp.fetchAll(requests);
    return responses;
  }
}

if (typeof module !== 'undefined') {
  module.exports = { RWGPS, RWGPSService }
}

if (typeof module !== 'undefined') {
  module.exports = RWGPS;
}

