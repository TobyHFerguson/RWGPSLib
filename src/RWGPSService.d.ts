/**
 * Type definitions for RWGPSService
 * Generated from RWGPSService.js
 * Google Apps Script Environment - No exports/imports
 */

/**
 * A number, or a string containing a number.
 */
declare type NumberLike = number | string;

/**
 * A public event URL from RideWithGPS
 * Format: https://ridewithgps.com/events/{id}[-optional-name]
 */
declare type PublicEventUrl = string;

/**
 * A public route URL from RideWithGPS
 * Format: https://ridewithgps.com/routes/{id}
 */
declare type PublicRouteUrl = string;

/**
 * HTTP response object from Google Apps Script UrlFetchApp
 */
declare interface HttpResponse {
    getContentText(): string;
    getResponseCode(): number;
    getHeaders(): { [key: string]: string };
    getBlob(): GoogleAppsScript.Base.Blob;
}

/**
 * Event object structure for RideWithGPS events
 */
declare interface Event {
    id?: NumberLike;
    name?: string;
    description?: string;
    start_date?: string;
    start_time?: string;
    all_day?: boolean | string | number;
    privacy_code?: string;
    copy_routes?: boolean | string | number;
    [key: string]: any;
}

/**
 * Event edit object containing URL and event data
 */
declare interface EventEditObject {
    url: PublicEventUrl;
    event: Event;
}

/**
 * Foreign route object for importing routes
 */
declare interface ForeignRoute {
    url: PublicRouteUrl;
    name?: string;
    description?: string;
    privacy_code?: string;
    [key: string]: any;
}

/**
 * API Service interface for making HTTP requests
 */
declare interface ApiService {
    login(): void;
    fetchPublicData(url: string, options?: any): any;
    fetchClubData(url: string, options?: any): any;
    fetchUserData(url: string | any[], options?: any): any;
    webSessionCookie: string;
}

/**
 * Globals interface containing canonical event structure
 */
declare interface Globals {
    CANONICAL_EVENT: Event;
}

/**
 * Main RWGPSService class for interacting with RideWithGPS API
 */
declare class RWGPSService {
    /**
     * API service instance for making requests
     */
    apiService: ApiService;

    /**
     * Global configuration and constants
     */
    globals: Globals;

    /**
     * Create a new RWGPSService instance
     * @param apiService - The API service for making HTTP requests
     * @param globals - Global configuration object
     */
    constructor(apiService: ApiService, globals: Globals);

    /**
     * Update multiple tags on multiple resources
     * @param ids - an id or an array of ids of the resources to be tagged
     * @param tags - an optional tag or array of tags
     * @param tag_action - one of 'add' or 'remove' to indicate addition or removal of tags
     * @param resource - the kind of resource to be operated on, one of 'event' or 'route'
     */
    private _batch_update_tags(ids: NumberLike[], tag_action: 'add' | 'remove', tags: string[], resource: 'event' | 'route'): any;

    /**
     * Check if a URL is a public event URL
     * @param url - the URL to check
     * @returns true if the URL is a public event URL, false otherwise
     */
    private _isPublicEventUrl(url: string): boolean;

    /**
     * Check if a URL is a public route URL
     * @param url - the URL to check
     * @returns true if the URL is a public route URL, false otherwise
     */
    private _isPublicRouteUrl(url: string): boolean;

    /**
     * Select the keys and values of the left object where every key in the left is in the right
     * @param left - source object
     * @param right - filter object
     * @return the new object created
     */
    private _key_filter(left: object, right: object): object;

    /**
     * Old method that used to send requests. Used to debug only library. Not used anymore.
     * @param url - request URL
     * @param options - request options
     * @returns HTTP response
     * @deprecated This method is deprecated and should not be used
     */
    private _send_request(url: string, options: any): HttpResponse;

    /**
     * Delete multiple events
     * @param event_ids - an array containing the ids of the events to delete
     * @returns the response object which contains an array of the deleted events
     */
    batch_delete_events(event_ids: string[]): object;

    /**
     * Delete multiple routes
     * @param route_urls - an array containing the ids of the routes to delete
     * @returns the response object which contains an array of the deleted routes
     */
    batch_delete_routes(route_urls: PublicRouteUrl[]): HttpResponse;

    /**
     * Copy an event template
     * @param template_url - public event URL to copy
     * @returns the response object
     * @remarks The Location header of the response contains the URL of the new event
     */
    copy_template_(template_url: PublicEventUrl): HttpResponse;

    /**
     * Delete an event
     * @param event_url - public event URL to delete
     * @returns the response object
     */
    deleteEvent(event_url: PublicEventUrl): HttpResponse;

    /**
     * Delete a single route by url
     * @param url - the public route URL to delete
     * @returns the response object
     */
    deleteRoute(url: PublicRouteUrl): object;

    /**
     * Edit an event
     * @param event_url - the public URL of the event to be edited
     * @param event - the event object containing the updated details only
     * @returns the response object
     */
    edit_event(event_url: PublicEventUrl, event: Event): object;

    /**
     * Edit multiple events
     * @param eventEditObjects - an array of event edit objects
     * @returns an array of response objects for each event edit
     */
    edit_events(eventEditObjects: EventEditObject[]): HttpResponse[];

    /**
     * Extract ID from a RWGPS URL
     * @param url - URL like "https://ridewithgps.com/events/403834-copied-event"
     * @return the ID extracted from the URL (e.g., "403834")
     */
    extractIdFromUrl(url: string): string | null;

    /**
     * GET the given url
     * @param url - the url whose resource is to be fetched
     * @returns the response object
     */
    get(url: string): object;

    /**
     * Get all events or routes
     * @param urls - an array of public event or route URLs
     * @param override - optional override parameters
     * @returns an array of response objects
     */
    getAll(urls: string[], override?: any): HttpResponse[];

    /**
     * Get event details by URL
     * @param url - public event URL
     * @returns event object as per https://github.com/ridewithgps/developers/blob/master/endpoints/events.md#get-apiv1eventsidjson
     */
    getEvent(url: PublicEventUrl): object;

    /**
     * Get organizer IDs for a specific event
     * @param url - public event URL
     * @param organizer_name - name of the organizer
     * @returns organizer information
     */
    getOrganizers(url: PublicEventUrl, organizer_name: string): any;

    /**
     * Get a single route by URL
     * @param url - the public route URL to retrieve
     * @returns the response object
     */
    getRoute(url: PublicRouteUrl): object;

    /**
     * Import a foreign route
     * @param routeObject - the foreign route object to be imported
     * @returns the response from the import operation
     */
    importRoute(routeObject: ForeignRoute): any;

    /**
     * Add multiple tags to multiple events - idempotent
     * @param ids - an array containing the ids of the events to add the tags to
     * @param tags - an array of the tags to be added to the events
     */
    tagEvents(ids: NumberLike[], tags: string[]): any;

    /**
     * Add multiple tags to multiple routes - idempotent
     * @param ids - an array containing the ids of the routes to add the tags to
     * @param tags - an array of the tags to be added to the routes
     */
    tagRoutes(ids: NumberLike[], tags: string[]): any;

    /**
     * Remove multiple tags from multiple events - idempotent
     * @param ids - an array containing the ids of the events to remove the tags from
     * @param tags - an array of the tags to be removed from the events
     */
    unTagEvents(ids: NumberLike[], tags: string[]): any;

    /**
     * Remove multiple tags from multiple routes - idempotent
     * @param ids - an array containing the ids of the routes to remove the tags from
     * @param tags - an array of the tags to be removed from the routes
     */
    unTagRoutes(route_ids: NumberLike[], tags: string[]): any;
}