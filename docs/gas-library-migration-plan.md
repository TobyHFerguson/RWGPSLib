# Google Apps Script → Node/Jest Migration Plan

**Goal:**
Migrate the Google Apps Script (GAS) library so that:

* It continues to function as a **GAS library** in production.
* It can also be tested locally using **Node + Jest**, with mocks for GAS-specific APIs such as `UrlFetchApp`, `PropertiesService`, etc.

---

## 🧭 Overview

The migration happens in progressive, low-risk steps.
Each step isolates GAS dependencies, modernizes code structure, and improves testability.

| Step | Focus                                | Risk           | Testing          | Release Cycle |
| ---- | ------------------------------------ | -------------- | ---------------- | ------------- |
| 1    | Introduce adapters                   | Low            | Smoke test       | Optional      |
| 2    | Normalize error handling             | Medium         | Targeted         | Minor         |
| 3    | Wrap responses in fetch-like objects | Medium–High    | Targeted         | Minor/Major   |
| 4    | Switch library API to async/Promise  | High           | Full regression  | Major         |
| 5    | Introduce Jest mocks                 | Low (dev only) | Verify Jest runs | None          |
| 6    | Migrate cookies → Bearer tokens      | High           | End-to-end       | Full          |

---

## Step 1 – Introduce Adapters

**Change:**
Create adapter functions that wrap direct GAS APIs.

```js
// adapters/gasAdapters.js
function gasFetch(url, options) {
  return UrlFetchApp.fetch(url, options);
}

function gasFetchAll(requests) {
  return UrlFetchApp.fetchAll(requests);
}

export { gasFetch, gasFetchAll };
```

Then replace calls in your library:

```js
// Before:
const response = UrlFetchApp.fetch(url, options);

// After:
const response = gasFetch(url, options);
```

**Why:**
Centralizes `UrlFetchApp` usage, making later replacement with Node-compatible code easy.

**Risk:** Very low
**Testing:** Quick smoke test that consumers still work.
**Release:** Optional patch bump.

---

## Step 2 – Normalize Error Handling

**Change:**
Always use `muteHttpExceptions: true` so that requests return response objects rather than throwing.

```js
function gasFetch(url, options = {}) {
  const opts = { muteHttpExceptions: true, ...options };
  return UrlFetchApp.fetch(url, opts);
}
```

**Why:**
Matches Node’s `fetch()` behavior (no exceptions for 4xx/5xx responses).

**Risk:** Medium
**Testing:** Try known failing URLs to confirm consistent handling.
**Release:** Minor version bump.

---

## Step 3 – Wrap Responses in Fetch-Like Objects

**Change:**
Return objects that mimic the Web Fetch API.

```js
function gasFetch(url, options = {}) {
  const opts = { muteHttpExceptions: true, ...options };
  const res = UrlFetchApp.fetch(url, opts);

  return {
    status: res.getResponseCode(),
    ok: res.getResponseCode() >= 200 && res.getResponseCode() < 300,
    text: () => res.getContentText(),
    json: () => JSON.parse(res.getContentText()),
    headers: res.getAllHeaders(),
  };
}
```

**Why:**
Brings your API closer to Node’s `fetch()` model; same code can run in both environments.

**Risk:** Medium–high
**Testing:** Verify pl
