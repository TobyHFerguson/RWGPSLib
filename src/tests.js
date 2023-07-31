//=========== Tests ===========
const Credentials = {
  username: "toby.h.ferguson@icloud.com",
  password: "1rider1"
}
const Globals = {
  STARTDATETIMECOLUMNNAME: "Date Time",
  GROUPCOLUMNNAME: "Group",
  STARTLOCATIONCOLUMNNAME: "Start Location",
  ROUTECOLUMNNAME: "Route",
  RIDELEADERCOLUMNNAME: "Ride Leader",
  RIDECOLUMNNAME: "Ride",
  ADDRESSCOLUMNNAME: "Address",
  LOCATIONCOLUMNNAME: "Location",
  PREFIXCOLUMNNAME: "Prefix",

  RIDE_LEADER_TBD_NAME: 'To Be Determined',

  A_TEMPLATE: `https://ridewithgps.com/events/186557-a-template`,
  B_TEMPLATE: `https://ridewithgps.com/events/186234-b-template`,
  C_TEMPLATE: `https://ridewithgps.com/events/186235-c-template`,
  SIGN_IN_URI: `https://ridewithgps.com/organizations/47/sign_in`,
  EVENTS_URI: 'https://ridewithgps.com/events/',

  SCCCC_USER_ID: 621846,
  RIDE_LEADER_TBD_ID: 4733240,

  METERS_TO_FEET: 3.28084,
  METERS_TO_MILES: 6.213712e-4,

  // LENGTHS are in miles
  // ELEVATION_GAINS are in feet
  C_RIDE_MAX_LENGTH: 35,
  C_RIDE_MAX_ELEVATION_GAIN: 2000,
  B_RIDE_MAX_LENGTH: 50,
  B_RIDE_MAX_ELEVATION_GAIN: 3000,
  A_RIDE_MIN_LENGTH: 40,
  A_RIDE_MAX_LENGTH: 80,
  A_RIDE_MIN_ELEVATION_GAIN: 3000,

  // Number of days after an event or an import that a route will expire
  EXPIRY_DELAY: 30,
}
const rwgpsService = new RWGPSService(Credentials.username, Credentials.password, Globals)
const rwgps = new RWGPS(rwgpsService);
const eventFactory = EventFactory(Globals);

function printTimings_(times, prefix) {
  const total = times.reduce((p, t) => p + t, 0);
  const avg = total / times.length;
  const max = times.reduce((p, t) => p >= t ? p : t, 0);
  const min = times.reduce((p, t) => p <= t ? p : t, 10000);
  console.log(`${prefix} - Average: ${avg} min: ${min} max: ${max}, total: ${total}`);
}


function testGetRSVPCounts() {
  const test_cases = [
    ['https://ridewithgps.com/events/196660-copied-event', 15],
    ['https://ridewithgps.com/events/193587-copied-event', 6],
    ['https://ridewithgps.com/routes/copied-event', 0]
  ];
  const counts = rwgps.getRSVPCounts(test_cases.map(tc => tc[0]));
  counts.forEach((actual, i) => {
    const uut = test_cases[i][0]
    const expected = test_cases[i][1];
    if (actual !== expected) {
      console.error(`Error - expected uut: ${uut} to give ${expected} but got ${actual}`)
    }
  })
}
function testGetEvents() {
  const rwgpsService = new RWGPSService(Credentials.username, Credentials.password, Globals);
  const rwgps = new RWGPS(rwgpsService);
  const events = rwgps.get_events([Globals.A_TEMPLATE, Globals.B_TEMPLATE]);
  if (!(events.length == 2)) console.error("didn't get the expected number of events");
}
function printTimings_(times, prefix) {
  const total = times.reduce((p, t) => p + t, 0);
  const avg = total / times.length;
  const max = times.reduce((p, t) => p >= t ? p : t, 0);
  const min = times.reduce((p, t) => p <= t ? p : t, 10000);
  console.log(`${prefix ? prefix + " -" : ""} Average: ${avg} min: ${min} max: ${max}, total: ${total}`);
}
function testEditEvents() {
  const NUMTESTS = 1;
  const NUMEVENTS = 5;
  const rwgpsService = new RWGPSService(Credentials.username, Credentials.password, Globals);
  const rwgps = new RWGPS(rwgpsService);
  function createTestEvents() {
    const urls = [];
    for (let i = 0; i < NUMEVENTS; i++) {
      urls.push(rwgps.copy_template_(Globals.A_TEMPLATE));
    }
    return urls;
  }

  function test(eventEditObjects, test_function) {
    const timings = [];

    for (let i = 0; i < NUMTESTS; i++) {
      const start = new Date();
      test_function(eventEditObjects);
      timings.push(new Date() - start);
    }
    printTimings_(timings, test_function.name);
  }

  function editSingle(eventEditObjects) {
    eventEditObjects.forEach(({ event, url }) =>
      rwgps.edit_event(url, event));
  }

  function editAll(eventEditObjects) {
    rwgps.edit_events(eventEditObjects);
  }

  function createEventEditObjects(urls) {
    let rwgpsEvents = rwgpsService.getAll(urls).map(resp => JSON.parse(resp.getContentText()));
    let events = rwgpsEvents.map(e => eventFactory.fromRwgpsEvent(e));
    let eventEditObjects = events.map((e, i) => { return { event: e, url: urls[i] } });
    return eventEditObjects;
  }
  let urls = createTestEvents();
  let eventEditObjects = createEventEditObjects(urls);
  eventEditObjects.forEach(({ event, url }) => event.name = "EDIT SINGLE TEST");
  test(eventEditObjects, editSingle);
  // rwgps.batch_delete_events(urls);
  urls = createTestEvents();
  eventEditObjects = createEventEditObjects(urls);
  eventEditObjects.forEach(({ event, url }) => event.name = "EDIT ALL TEST");
  test(eventEditObjects, editAll);
  // rwgps.batch_delete_events(urls);
}
function testGetAll() {
  function timedGet(urls) {
    const start = new Date();
    let results = rwgpsService.getAll(urls);
    let ids = results.map(r => {
      const rc = r.getResponseCode();
      const body = JSON.parse(r.getContentText()).event.id;
    })
    return new Date() - start;
  }

  const events = [ 'https://ridewithgps.com/events/196660-copied-event', 'https://ridewithgps.com/events/193587-copied-event' ];
  const urls = [];
  let timings = [];
  for (let i = 0; i < 100; i++) {
    timings.push(timedGet(events.slice(0, 1)))
  }
  printTimings_(timings, "getAll");

  for (let i = 0; i < 100; i++) {
    urls.push(events[0]);
  }
  timings = [];
  timings.push(timedGet(urls))
  printTimings_(timings, "getAll");
}
//------------------------------
// function testEditNameOnly() {
//   const rwgpsService = new RWGPSService(Credentials.username, Credentials.password, Globals);
//   const rwgps = new RWGPS(rwgpsService);
//   const event_URL = rwgps.copy_template_("https://ridewithgps.com/events/196961-test-event");
//   console.log(`New Event URL: ${event_URL}`);
//   const initial_body = rwgps.get_event(event_URL);
//   const ibk = Object.keys(initial_body);
//   const new_body = JSON.parse(rwgps.edit_event(event_URL, initial_body).getContentText());
//   const nbk = Object.keys(new_body);
//   if (ibk.length !== nbk.length){
//     console.log("Expected keys to be same - they weren't")
//   }
//   rwgps.batch_delete_events([event_URL]);
// }

// function testGetParticipants() {
//   let rwgps, event_URL;
//   const rwgpsService = new RWGPSService(Credentials.username, Credentials.password, Globals);
//   rwgps = new RWGPS(rwgpsService);

// }
function testRoundTrip() {
  let rwgps, event_URL;
  try {
    const rwgpsService = new RWGPSService(Credentials.username, Credentials.password, Globals);
    rwgps = new RWGPS(rwgpsService);
    event_URL = rwgps.copy_template_("https://ridewithgps.com/events/196910");
    console.log(`New Event URL: ${event_URL}`);
    const initial_body = rwgps.get_event(event_URL);
    initial_body.organizer_ids = initial_body.organizer_ids.join(',');
    initial_body.route_ids = initial_body.routes.map(r => r.id).join(',');
    const sa = initial_body.starts_at ? initial_body.starts_at : new Date();
    initial_body.start_date = sa.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
    initial_body.start_time = sa.toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "numeric" });

    const ibk = Object.keys(initial_body);
    const new_body = JSON.parse(rwgps.edit_event(event_URL, initial_body).getContentText());
    const nbk = Object.keys(new_body);
    if (ibk.length !== nbk.length) {
      console.log("Expected keys to be same - they weren't")
    }
  }
  catch (e) {
    console.log(e);
    rwgps.batch_delete_events([event_URL]);
  }
}

function testImportRoute() {
  const rwgpsService = new RWGPSService(Credentials.username, Credentials.password, Globals);
  const rwgps = new RWGPS(rwgpsService);
  console.log(rwgps.importRoute('https://ridewithgps.com/routes/19551869'));
  console.log(rwgps.importRoute({ url: 'https://ridewithgps.com/routes/19551869', visibility: 2, name: "Toby's new route", expiry: '12/24/2022' }));
}

function testUdatingRouteExpiration() {
  const rwgpsService = new RWGPSService(Credentials.username, Credentials.password, Globals);
  const rwgps = new RWGPS(rwgpsService);
  rwgps.setRouteExpiration("https://ridewithgps.com/routes/41365882", "11/22/2023");
  rwgps.setRouteExpiration("https://ridewithgps.com/routes/41365882", "11/23/2023");
  const new_tag_found = rwgps.getRouteObject("https://ridewithgps.com/routes/41365882").tag_names.includes("expires: 11/23/2023")
  if (!new_tag_found) {
    throw Error("testUdatingRouteExpiration() failed - no tag 'expires: 11/23/2023' was found");
  }
  const old_tag_found = rwgps.getRouteObject("https://ridewithgps.com/routes/41365882").tag_names.includes("expires: 11/22/2023")
  if (old_tag_found) {
    throw Error("testDeletingRouteExpiration() failed - unexpectedly found expired tag 'expires: 11/22/2023'");
  }
}
function testDeletingRouteExpiration() {
  const rwgpsService = new RWGPSService(Credentials.username, Credentials.password, Globals);
  const rwgps = new RWGPS(rwgpsService);
  rwgps.setRouteExpiration("https://ridewithgps.com/routes/41365882", "11/22/2023");
  rwgps.setRouteExpiration("https://ridewithgps.com/routes/41365882");
  const tag_found = rwgps.getRouteObject("https://ridewithgps.com/routes/41365882").tag_names.includes("expires: 11/22/2023")
  if (tag_found) {
    throw Error("testDeletingRouteExpiration() failed - unexpectedly found deleted tag 'expires: 11/22/2023'");
  }
}
function testSetRouteExpiration() {
  const rwgpsService = new RWGPSService(Credentials.username, Credentials.password, Globals);
  const rwgps = new RWGPS(rwgpsService);
  rwgps.setRouteExpiration("https://ridewithgps.com/routes/41365882", "11/22/2023");
  const tag_found = rwgps.getRouteObject("https://ridewithgps.com/routes/41365882").tag_names.includes("expires: 11/22/2023")
  if (!tag_found) {
    throw Error("testSetRouteExpiration() failed - no tag 'expires: 11/22/2023' was found");
  }
}
function testTagEvents() {
  const rwgpsService = new RWGPSService(Credentials.username, Credentials.password, Globals);
  rwgpsService.tagEvents(['189081'], ['Tobys Tag']);
}
function testUntagEvents() {
  const rwgpsService = new RWGPSService(Credentials.username, Credentials.password, Globals);
  rwgpsService.unTagEvents(['189081'], ['Tobys Tag']);
}
function testUnTagRoutes() {
  const rwgpsService = new RWGPSService(Credentials.username, Credentials.password, Globals);
  rwgpsService.unTagRoutes(['41365882'], ['Tobys Tag']);
}
function testTagRoutes() {
  const rwgpsService = new RWGPSService(Credentials.username, Credentials.password, Globals);
  rwgpsService.tagRoutes(['41365882'], ['Tobys Tag']);
}
function testGetEvent() {
  let rwgps = new RWGPS(new RWGPSService(Credentials.username, Credentials.password, Globals));
  let url = "https://ridewithgps.com/events/189081-copied-event";
  const event = rwgps.get_event(url);
  Logger.log(event.starts_at);
  Logger.log(new Date(event.starts_at));
  console.log(new Date("9/27/2022 09:00"));
  console.log(dates.compare("9/27/2022", event.starts_at));
}

function testLookupOrganizer() {
  const rwgpsService = new RWGPSService(Credentials.username, Credentials.password, Globals);
  const rwgps = new RWGPS(rwgpsService);

  const name = 'Peter Stanger';

  const organizer = rwgps.lookupOrganizer(Globals.A_TEMPLATE, name);
  console.log(organizer);
  console.log(rwgps.knownRideLeader(name))
}

function testGetRSVPObject() {


  const id = 215744
  let rwgps = new RWGPS(new RWGPSService(Credentials.username, Credentials.password, Globals));
  const rsvpObject = rwgps.getRSVPObject(id);
  console.log(rsvpObject);
}