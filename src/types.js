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
