# Full Guide — GAS Library → Node/Jest Migration Plan (Class-Based Architecture)

**Purpose:**
This guide outlines how to migrate a Google Apps Script (GAS) library into a modern, testable module that can run both as a GAS library in production and locally under Node with Jest for development and CI.

**Core idea:**

* Separate HTTP requests, authentication, and session state into an `ApiService` class.
* Centralize credential management with a `CredentialManager` class.
* Isolate GAS-specific code so the majority of the library is portable and testable.

---

## Table of contents

1. Goals & Constraints
2. High-level roadmap
3. Adapter abstraction (fetch-like wrappers)
4. `muteHttpExceptions` error handling
5. Node adapter & dependency injection
6. Jest setup and mock strategy
7. Migration checklist and testing matrix
8. Release and versioning recommendations
9. Appendix: useful commands and snippets

---

## 1. Goals & Constraints

* **Keep production behavior**: The library must continue to run as a GAS library.
* **Enable local development**: Allow running unit tests with Jest/Node without calling GAS APIs.
* **Minimal API surface changes**: Prefer internal refactors over breaking public APIs.
* **Security**: Use Script Properties in GAS and environment variables for Node; do not commit secrets.

---

## 2. High-level roadmap

1. Introduce `ApiService` + `CredentialManager` classes; move all `UrlFetchApp` usage into the service.
2. Add fetch-like response wrappers (status, ok, text(), json()).
3. Create a `FetchAdapter` abstraction with `GASFetchAdapter` and `NodeFetchAdapter`.
4. Make `ApiService` accept a `fetchAdapter` via dependency injection.
5. Add Jest tests, mocking the fetch adapter for unit tests.
6. (Optional) Migrate auth from cookies to bearer tokens for a cleaner API.

---

## 3. Adapter abstraction (Step 3)

* `_wrapResponse()` ensures that responses behave like the standard Web fetch API.
* Consumers read `.status`, `.ok`, `.text()`, `.json()` instead of GAS-specific methods.
* Transitional compatibility layers can be added if needed.

---

## 4. Error handling with `muteHttpExceptions` (Step 2)

**Purpose:**

* Ensure GAS requests do not throw exceptions on 4xx or 5xx responses.
* Normalize error handling so `_wrapResponse()` can always process the response.

**Implementation guidance:**

* In GAS, always set `options.muteHttpExceptions = true` when preparing requests.
* This can be done in `_prepareRequest()` or the adapter layer.
* RWGPSService will interpret the OK/not OK response and throw an exception appropriately. 
* The goal is to have RWGPSService completely hide the HTTP/HTTPResponse from RWGPS and higher code

**Example:**

```javascript
request.options = Object.assign({}, request.options, { muteHttpExceptions: true });
```

**Testing:**

* Make a request that is expected to fail (e.g., a 404 URL).
* Confirm that the wrapped response returns `.status` correctly instead of throwing.
* For batch requests, verify each response respects `muteHttpExceptions`.
* In Node, the adapter can optionally emulate this behavior for consistency.

**Notes:**

* This step reduces risk in subsequent stages (wrapping responses, async migration).
* Ensures error responses are handled uniformly across GAS and Node.

---

## 5. Node adapter & dependency injection (Step 4)

* Implement `NodeFetchAdapter` using `node-fetch` (or `undici`), returning fetch-like responses.
* Implement `GASFetchAdapter` for `UrlFetchApp`.
* Inject the adapter into `ApiService` so the same service code can run on GAS or Node.

**Example usage:**

```javascript
// GAS
const api = new ApiService(creds, new GASFetchAdapter());

// Node
const api = new ApiService(creds, new NodeFetchAdapter());
```

---

## 6. Jest setup and mock strategy (Step 5)

* Repository layout:

```
project/
  src/
    ApiService.js
    CredentialManager.js
    adapters/
      GASFetchAdapter.js
      NodeFetchAdapter.js
  tests/
    apiService.test.js
  package.json
  jest.config.js
```

* Jest configuration is minimal, just set `testEnvironment` to `node`.
* Mock the fetch adapter in tests to simulate HTTP responses without hitting real endpoints.

---

## 7. Migration checklist and testing matrix

**Phase 1 — Stabilize in GAS**

* Implement classes and GAS adapter.
* Run smoke tests: login, public fetch, basic auth fetch, batch fetch.
* Verify `muteHttpExceptions` works for expected failing requests.

**Phase 2 — Add wrappers & adapt callers**

* Introduce `_wrapResponse()`.
* Update consumer code to use `.status` / `.text()` / `.json()`.

**Phase 3 — Node adapter & tests**

* Implement `NodeFetchAdapter`.
* Inject adapter for Jest and Node integration tests.
* Add unit tests covering critical paths.

**Phase 4 — Auth migration (optional)**

* Switch to bearer token auth.
* Update `_prepareRequest()`.
* Run full end-to-end tests with live endpoints.

**Testing matrix**

| Area                    | GAS (live) | Node (Jest unit) | Node (integration) |
| ----------------------- | ---------: | ---------------: | -----------------: |
| Login / cookie handling |          ✓ |             mock |      optional live |
| Basic auth              |          ✓ |             mock |      optional live |
| Public fetch            |          ✓ |             mock |                  ✓ |
| Batch fetch             |          ✓ |       mock/array |      optional live |
| Error responses         |          ✓ |             mock |      optional live |

---

## 8. Release and versioning recommendations

* Internal refactor → patch/minor release.
* Response shape changes → minor release with consumer communication.
* Async call style or auth model changes → major release.
* Use staged releases: canary/internal consumer test → public release.

---

## 9. Appendix — useful commands and snippets

**Run Jest:**

```bash
npm install
npm test
# or
npx jest --watch
```

**Local secrets for Node tests:**

```json
{
  "rwgps_username": "alice",
  "rwgps_password": "secret",
  "rwgps_api_key": "abc",
  "rwgps_auth_token": "def"
}
```

**Search/replace guidance:**

* Find `getResponseCode()` usages: `rg "getResponseCode\(" -n`
* Replace with `.status` usage (manual review recommended).

---

**Notes:**

* Class-based design keeps auth + fetch logic in one place for easy adapter swapping.
* `muteHttpExceptions` ensures error responses are captured uniformly.
* Keep public API surface stable; use shims and deprecation warnings when breaking changes are unavoidable.
