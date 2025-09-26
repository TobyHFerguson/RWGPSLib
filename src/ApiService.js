
/**
 * The main API service. It handles all fetch requests and
 * manages authentication using an internal CredentialManager.
 */
class ApiService {
    constructor(credentialManager) {
        this.credentialManager = credentialManager;
        this.webSessionCookie = null;
    }

    // A private helper method to prepare a single request with proper headers.
    _prepareRequest(request, authType) {
        let headers = request.headers || {};
        headers['Accept'] = headers['Accept'] || 'application/json';

        // Automatically set the method based on the presence of a payload
        if (request.payload && !request.method) {
            request.method = 'post';
        } else if (!request.method) {
            request.method = 'get';
        }

        if (authType) {
            if (authType === 'WEB_SESSION') {
                if (!this.webSessionCookie) {
                    throw new Error('Web session not authenticated. Please log in first.');
                }
                headers['Cookie'] = this.webSessionCookie;
                headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
            } else if (authType === 'BASIC_AUTH') {
                const apiKey = this.credentialManager.getApiKey();
                const authToken = this.credentialManager.getAuthToken();
                const encodedAuth = Utilities.base64Encode(`${authToken}:${apiKey}`);
                headers['Authorization'] = `Basic ${encodedAuth}`;
            }
        }

        if (request.payload && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        request.headers = headers;
        return {
            ...request
        };
    }

    /**
     * Handles the initial login to get the web session cookie.
     */
    login() {
        const username = this.credentialManager.getUsername();
        const password = this.credentialManager.getPassword();
        const loginUrl = 'https://ridewithgps.com/organizations/47/sign_in';
        const headers = { 'user-email': username, 'user-password': password };
        const options = {
            method: 'post',
            headers: headers,
            contentType: 'application/json',
            followRedirects: false
        };

        try {
            const response = UrlFetchApp.fetch(loginUrl, options);
            const headers = response.getAllHeaders();
            const setCookieHeader = Array.isArray(headers['Set-Cookie']) ? headers['Set-Cookie'][0] : headers['Set-Cookie'];
            this.webSessionCookie = setCookieHeader.split(';')[0];
            return true;
        } catch (e) {
            console.log(`Login request failed: ${e.message}`);
            return false;
        }
    }

    /**
     * A single, powerful fetch method that handles both individual and batch requests.
     *
     * @param {string|Array<Object>} endpoint A single endpoint string or an array of request objects.
     * @param {Object} [options={}] The options object for a single request, or a default options object for all requests in a batch.
     * @param {string} authType The authentication type for the request(s).
     * @returns {UrlFetchApp.HTTPResponse|Array<UrlFetchApp.HTTPResponse>} The response(s) from the API.
     */
    _fetch(endpoint, options, authType) {
        if (Array.isArray(endpoint)) {
            const processedRequests = endpoint.map(request => {
                const finalRequest = { ...request, ...options };
                return this._prepareRequest(finalRequest, authType);
            });
            console.log('Processed Requests:', processedRequests);
            return UrlFetchApp.fetchAll(processedRequests);
        } else {
            const url = `${endpoint}`;
            const request = this._prepareRequest({ url, ...options }, authType);
            const { url: _url, ...requestWithoutUrl } = request;
            return UrlFetchApp.fetch(_url, requestWithoutUrl);
        }
    }

    // Wrappers that provide a clean, user-friendly API
    // ----------------------------------------------------

    /**
     * Fetches data that requires a web session. Handles both single and batch requests.
     * @param {string|Array<Object>} endpoint
     * @param {Object} [options={}]
     * @returns {UrlFetchApp.HTTPResponse|Array<UrlFetchApp.HTTPResponse>}
     */
    fetchUserData(endpoint, options = {}) {
        return this._fetch(endpoint, options, 'WEB_SESSION');
    }

    /**
     * Fetches club data using Basic Authentication. Handles both single and batch requests.
     * @param {string|Array<Object>} endpoint
     * @param {Object} [options={}]
     * @returns {UrlFetchApp.HTTPResponse|Array<UrlFetchApp.HTTPResponse>}
     */
    fetchClubData(endpoint, options = {}) {
        return this._fetch(endpoint, options, 'BASIC_AUTH');
    }

    fetchPublicData(endpoint, options = {}) {
        return this._fetch(endpoint, options, null);
    }
}

// Example usage
function myFunction() {
    const api = new ApiService();

    // Example of making a web session call
    try {
        api.login();
        const userDataResponse = api.fetchUserData('/profile');
        Logger.log('User data: ' + userDataResponse.getContentText());
    } catch (e) {
        Logger.log('Web session failed: ' + e.message);
    }

    // Example of using gasFetchAll to make multiple calls at once
    try {
        const requests = [
            {
                url: 'https://public-api.com/leaderboard',
                options: { 'method': 'get' },
                authType: 'BASIC_AUTH'
            },
            {
                url: 'https://public-api.com/events',
                options: { 'method': 'get' },
                authType: 'BASIC_AUTH'
            }
        ];

        const responses = api.gasFetchAll(requests);
        responses.forEach((response, index) => {
            Logger.log(`Response ${index + 1}: ` + response.getContentText());
        });
    } catch (e) {
        Logger.log('Batch API call failed: ' + e.message);
    }
}