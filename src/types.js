/**
 * @typedef {string} PublicEventUrl
 * A string representing a public event URL.
 * The URL must match the pattern /^https:\/\/ridewithgps\.com\/events\/\d+[^/]*$/.
 */

/**
 * @typedef {string} PublicRouteUrl
 * A string representing a public route URL.
 * The URL must match the pattern /^https:\/\/ridewithgps\.com\/routes\/\d+$/.
 */

/**
 * @typedef {{url: PublicRouteUrl} & object} ForeignRoute - an object representing a foreign route (must have at a minimum a URL), defined in { @link routes | https://github.com/ridewithgps/developers/blob/master/endpoints/routes.md#get-apiv1routesidjson}
 */

/**
 * @typedef {Object} Event - as defined in { @link events | https://github.com/ridewithgps/developers/blob/master/endpoints/events.md#get-apiv1eventsidjson}
 */

/**
* A number, or a string containing a number.
* @typedef {(number|string)} NumberLike
*/

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
   * @typedef EventEditObject
   * @property {PublicEventUrl} url - an event url
   * @property {Event} event - an Event
   */

  /**
   * @typedef Route
   * @type {Object}
   * @property {string} url - the foreign route's url
   * @property {Number} [visibility = 0] - the visibility to set the imported route to. Defaults to 0 (Public)
   * @property {string} [name] - the name of the imported route. Defaults to the foreign route's name.
   * @property {Date} [expiry] - date that the imported route should be expired.
   * @property {string[]} [tags] - tags to be added to the imported route
   */
