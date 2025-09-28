var should = require('chai').should();
const sinon = require('sinon');
const managedEvent = require('./fixtures/MyPayload.js')
const EventFactory = require('../src/EventFactory.js');
const managedRwgpsEvent = require('./fixtures/event.json').event;
const organizers = [{ id: 302732, text: "Toby Ferguson" }];

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

     A_TEMPLATE: `https://ridewithgps.com/events/404021-a-template`,
        B_TEMPLATE: `https://ridewithgps.com/events/404019-b-template`,
        C_TEMPLATE: `https://ridewithgps.com/events/404022-c-template`,
    SIGN_IN_URI: `https://ridewithgps.com/organizations/47/sign_in`,
    RSVP_BASE_URL: 'https://tinyurl.com/3b8njz7y',

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

describe("Event Factory Tests", () => {
    const managedRow = {
        StartDate: "2023-01-01T18:00:00.000Z",
        StartTime: "2023-01-01T18:00:00.000Z",
        Group: 'A',
        RouteName: 'SCP - Seascape/Corralitos',
        RouteURL: 'http://ridewithgps.com/routes/17166902',
        RideLeader: 'Toby Ferguson',
        RideName: '',
        RideURL: '',
        Location: 'Seascape County Park',
        Address: 'Address: Seascape County Park, Sumner Ave, Aptos, CA 95003'
    }
    const unmanagedRow = { ...managedRow, RideName: 'Tobys Ride' }
    const uut = EventFactory(Globals);
    describe("Basic Construction", () => {
        describe("fromRow()", () => {
            it("should build from a row", () => {
                const actual = uut.newEvent(managedRow, organizers);
                const expected = managedEvent;
                actual.should.deep.equal(expected);
            })
            it("It should create a brand new object on each call", () => {
                let e1 = uut.newEvent(managedRow, organizers);

                let e2 = uut.newEvent(managedRow, organizers);
                e1.should.not.equal(e2);
            })
            it("should use the given ride name for unmanaged events", () => {
                const expected = { ...managedEvent, name: 'Tobys Ride [1]' }
                const actual = uut.newEvent(unmanagedRow, organizers);
                actual.should.deep.equal(expected);
            })
            it("should create a new ride name for managed events", () => {
                const expected = { ...managedEvent, 
                    name: "Wed A (2/1 10:00) [1] SCP - Seascape/Corralitos",
                    "start_date": "2023-02-01T18:00:00.000Z",
                    "start_time": "2023-02-01T18:00:00.000Z"
                  }
                const mr = { ...managedRow, StartDate: "2023-02-01T18:00:00.000Z", StartTime: "2023-02-01T18:00:00.000Z"}
                const actual = uut.newEvent(mr, organizers);
                actual.should.deep.equal(expected);
            })
            it("should throw an error if row is missing", () => {
                (() => uut.newEvent()).should.throw("no row object given");
            })
            it("should return an event even if organizers is missing", () => {
                const expected = { ...managedEvent };
                expected.desc = expected.desc.replace("Toby Ferguson", "To Be Determined")
                expected.name = expected.name.replace("[1]", "[0]");
                expected.organizer_tokens = [Globals.RIDE_LEADER_TBD_ID + ""];

                const actual = uut.newEvent(managedRow, [])
                actual.should.deep.equal(expected);
            })
        })
        describe("fromRwgpsEvent()", () => {

            it("should return the managedEvent", () => {
                let actual = uut.fromRwgpsEvent(managedRwgpsEvent);
                const expected = managedEvent;
                actual.should.deep.equal(expected);
            })
            it("should return an event even if the description is missing", () => {
                const testcase = managedRwgpsEvent;
                delete testcase.desc;
                let actual = uut.fromRwgpsEvent(testcase);
                const expected = managedEvent;
                expected.desc = '';
                actual.should.deep.equal(expected);
            })
            it("should return an event even if the routes are missing", () => {
                const testcase = managedRwgpsEvent;
                delete testcase.routes;
                let actual = uut.fromRwgpsEvent(testcase);
                const expected = managedEvent;
                expected.route_ids = [];
                actual.should.deep.equal(expected);
            })
            it("should return an event even if the start_at date is missing", () => {
                const testcase = managedRwgpsEvent;
                delete testcase.starts_at;
                let actual = uut.fromRwgpsEvent(testcase);
                const actual_start_date = actual.start_date;
                const actual_start_time = actual.start_time;
                delete actual.start_time;
                delete actual.start_date;
                const expected = managedEvent;
                delete expected.start_date;
                delete expected.start_time;
                actual.should.deep.equal(expected);
                actual_start_date.should.be.a("string");
                actual_start_time.should.be.a("string");
            })
        })
    })
})