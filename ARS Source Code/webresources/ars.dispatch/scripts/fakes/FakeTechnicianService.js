/*global $, ARS, Promise */

var ARS;
ARS = ARS || {};
ARS.Fakes = ARS.Fakes || {};
ARS.Fakes.FakeTechnicianService = (function () {
    "use strict";

    var technicians = [
        {
            id:               "e9becb12-212a-47fd-8b32-d80f8f40f2d4",
            name:             "George Washington",
            regionId:         "e9becb12-212a-47fd-8b32-d80f8f40f2d2",
            city:             "Mount Vernon",
            state:            "Virginia",
            timeZone:         "Eastern Standard Time",
            latitude:         38.735278,
            longitude:        -77.095278
        }, {
            id:               "85d23a06-ca4c-41ba-8659-dc7b63a0b54e",
            name:             "John Adams",
            regionId:         "9d376648-d624-4df5-a183-055c77267154",
            timeZone:         "Eastern Standard Time",
            city:             "Quincy",
            state:            "Massachusetts",
            latitude:         42.25,
            longitude:        -71
        }, {
            id:               "9d376648-d624-4df5-a183-055c77267159",
            name:             "Thomas Jefferson",
            regionId:         "e9becb12-212a-47fd-8b32-d80f8f40f2d2",
            timeZone:         "Eastern Standard Time",
            city:             "Charlottesville",
            state:            "Virginia",
            latitude:         38.03,
            longitude:        -78.478889
        }, {
            id:               "29dfbda4-ffbf-46ba-88d3-037a002d6556",
            name:             "James Madison",
            regionId:         "e9becb12-212a-47fd-8b32-d80f8f40f2d2",
            timeZone:         "Eastern Standard Time",
            city:             "Orange",
            state:            "Virginia",
            latitude:         38.245833,
            longitude:        -78.109722
        }, {
            id:               "83b4fed4-d509-47bd-97f0-8fe7fee8bc5a",
            name:             "James Monroe",
            regionId:         "9d376648-d624-4df5-a183-055c77267154",
            timeZone:         "Eastern Standard Time",
            city:             "Leesburg",
            state:            "Virginia",
            latitude:         39.116667,
            longitude:        -77.55
        }, {
            id:               "144fe0e0-2636-42b3-8607-a0fc45396672",
            name:             "John Quincy Adams",
            regionId:         "e9becb12-212a-47fd-8b32-d80f8f40f2d2",
            timeZone:         "Eastern Standard Time",
            city:             "Quincy",
            state:            "Massachusetts",
            latitude:         42.25,
            longitude:        -71
        }, {
            id:               "9c808a6a-1d88-46ca-9863-0ab10a729958",
            name:             "Andrew Jackson",
            regionId:         "e9becb12-212a-47fd-8b32-d80f8f40f2d2",
            timeZone:         "Central Standard Time",
            city:             "Nashville",
            state:            "Tennessee",
            latitude:         36.166667,
            longitude:        -86.783333
        }, {
            id:               "da971790-af92-4021-8786-b9a91d9cd3be",
            name:             "Martin Van Buren",
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            timeZone:         "Eastern Standard Time",
            city:             "Kinderhook",
            state:            "New York",
            latitude:         42.412778,
            longitude:        -73.681389
        }, {
            id:               "58d432e1-a28a-4a45-9c8a-74b705accd4a",
            name:             "William Henry Harrison",
            regionId:         "e9becb12-212a-47fd-8b32-d80f8f40f2d2",
            timeZone:         "Eastern Standard Time",
            city:             "Vincennes",
            state:            "Indiana",
            latitude:         38.678333,
            longitude:        -87.516111
        }, {
            id:               "53c1a536-9075-4ef8-b6f6-134d190f5c24",
            name:             "John Tyler",
            regionId:         "e9becb12-212a-47fd-8b32-d80f8f40f2d2",
            timeZone:         "Eastern Standard Time",
            city:             "Charles City County",
            state:            "Virginia",
            latitude:         null,
            longitude:        null
        }, {
            id:               "5f451850-8fa7-40ac-b5f2-cd4364a5ba8e",
            name:             "James K. Polk",
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            timeZone:         "Eastern Standard Time",
            city:             "Columbia",
            state:            "Tennessee",
            latitude:         35.615,
            longitude:        -87.044444
        }, {
            id:               "11b471e9-6f24-46e5-92a9-559ff5ec025b",
            name:             "Zachary Taylor",
            regionId:         "e9becb12-212a-47fd-8b32-d80f8f40f2d2",
            timeZone:         "Eastern Standard Time",
            city:             "Louisville",
            state:            "Kentucky",
            latitude:         38.25,
            longitude:        -85.766667
        }, {
            id:               "b9928990-3d53-4bad-a807-4f2473c1b761",
            name:             "Millard Fillmore",
            regionId:         "85d23a06-ca4c-41ba-8659-dc7b63a0b543",
            timeZone:         "Eastern Standard Time",
            city:             "East Aurora",
            state:            "New York",
            latitude:         42.766944,
            longitude:        -78.617222
        }, {
            id:               "858feb71-bec8-4854-b8f8-86d90cb01a00",
            name:             "Franklin Pierce",
            regionId:         "9d376648-d624-4df5-a183-055c77267154",
            timeZone:         "Eastern Standard Time",
            city:             "Concord",
            state:            "New Hampshire",
            latitude:         43.206667,
            longitude:        -71.538056
        }, {
            id:               "477d0500-b0f4-41dd-a13f-f15bf9936d14",
            name:             "James Buchanan",
            regionId:         "85d23a06-ca4c-41ba-8659-dc7b63a0b543",
            timeZone:         "Eastern Standard Time",
            city:             "Lancaster",
            state:            "Pennsylvania",
            latitude:         40.039722,
            longitude:        -76.304444
        }, {
            id:               "ffefac43-f31a-4183-8677-bed12fe91b62",
            name:             "Abraham Lincoln",
            regionId:         "e9becb12-212a-47fd-8b32-d80f8f40f2d2",
            timeZone:         "Central Standard Time",
            city:             "Springfield",
            state:            "Illinois",
            latitude:         39.698333,
            longitude:        -89.619722
        }, {
            id:               "5a155ba2-d72e-42b8-8570-bad78e79b18d",
            name:             "Andrew Johnson",
            regionId:         "9d376648-d624-4df5-a183-055c77267154",
            timeZone:         "Eastern Standard Time",
            city:             "Greeneville",
            state:            "Tennessee",
            latitude:         36.168333,
            longitude:        -82.8225
        }, {
            id:               "74149156-0793-43ee-9a09-b55228f964f0",
            name:             "Ulysses S. Grant",
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            timeZone:         "Central Standard Time",
            city:             "St. Louis",
            state:            "Missouri",
            latitude:         38.627222,
            longitude:        -90.197778
        }, {
            id:               "3d20d986-c7b7-4a04-9098-8294cdba9a9c",
            name:             "Rutherford B. Hayes",
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            timeZone:         "Eastern Standard Time",
            city:             "Fremont",
            state:            "Ohio",
            latitude:         41.348889,
            longitude:        -83.117222
        }, {
            id:               "19ddaa00-6979-4ad6-ba51-c088cd48492b",
            name:             "James A. Garfield",
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            timeZone:         "Eastern Standard Time",
            city:             "Mentor",
            state:            "Ohio",
            latitude:         41.691111,
            longitude:        -81.341944
        }, {
            id:               "35f673e5-fb44-43f1-af70-4255217ed123",
            name:             "Chester A. Arthur",
            regionId:         "85d23a06-ca4c-41ba-8659-dc7b63a0b543",
            timeZone:         "Eastern Standard Time",
            city:             "New York City",
            state:            "New York",
            latitude:         40.7127,
            longitude:        -74.0059
        }, {
            id:               "06f7df55-a5e3-4c89-91ff-928a82dd516d",
            name:             "Grover Cleveland",
            regionId:         "9d376648-d624-4df5-a183-055c77267154",
            timeZone:         "Eastern Standard Time",
            city:             "Princeton",
            state:            "New Jersey",
            latitude:         40.357115,
            longitude:        -74.670165
        }, {
            id:               "b59691e4-cd75-43ef-800c-0098b4aeab56",
            name:             "Benjamin Harrison",
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            timeZone:         "Eastern Standard Time",
            city:             "Indianapolis",
            state:            "Indiana",
            latitude:         39.766667,
            longitude:        -86.15
        }, {
            id:               "4964df95-5e3a-4d2d-8f49-9ec964db8367",
            name:             "Grover Cleveland",
            regionId:         "9d376648-d624-4df5-a183-055c77267154",
            timeZone:         "Eastern Standard Time",
            city:             "Princeton",
            state:            "New Jersey",
            latitude:         40.357115,
            longitude:        -74.670165
        }, {
            id:               "4733033f-e249-409f-a7d8-4e47a8def83d",
            name:             "William McKinley",
            regionId:         "9d376648-d624-4df5-a183-055c77267154",
            timeZone:         "Eastern Standard Time",
            city:             "Canton",
            state:            "Ohio",
            latitude:         40.805,
            longitude:        -81.375833
        }, {
            id:               "1e0e5646-38b5-49ed-aa6a-bb39fa076134",
            name:             "Theodore Roosevelt",
            regionId:         "e9becb12-212a-47fd-8b32-d80f8f40f2d2",
            timeZone:         "Eastern Standard Time",
            city:             "Oyster Bay",
            state:            "New York",
            latitude:         40.872444,
            longitude:        -73.530778
        }, {
            id:               "b8076b7c-5688-4859-aa46-2c11e57f9728",
            name:             "William Howard Taft",
            regionId:         "85d23a06-ca4c-41ba-8659-dc7b63a0b543",
            timeZone:         "Eastern Standard Time",
            city:             "Cincinnati",
            state:            "Ohio",
            latitude:         39.1,
            longitude:        -84.516667
        }, {
            id:               "bd1647d0-8a7b-406d-a96c-36395591e63b",
            name:             "Woodrow Wilson",
            regionId:         "85d23a06-ca4c-41ba-8659-dc7b63a0b543",
            timeZone:         "Eastern Standard Time",
            city:             "Princeton",
            state:            "New Jersey",
            latitude:         40.357115,
            longitude:        -74.670165
        }, {
            id:               "db54e116-82f6-4f27-96b8-ed047aaed2e0",
            name:             "Warren G. Harding",
            regionId:         "85d23a06-ca4c-41ba-8659-dc7b63a0b543",
            timeZone:         "Eastern Standard Time",
            city:             "Marion",
            state:            "Ohio",
            latitude:         40.586667,
            longitude:        -83.126389
        }, {
            id:               "567745c4-9431-499d-b0e1-8003529cb82b",
            name:             "Calvin Coolidge",
            regionId:         "e9becb12-212a-47fd-8b32-d80f8f40f2d2",
            timeZone:         "Eastern Standard Time",
            city:             "Northampton",
            state:            "Massachusetts",
            latitude:         42.333333,
            longitude:        -72.65
        }, {
            id:               "63619a75-3a03-4d4f-8716-7218c6b37551",
            name:             "Herbert Hoover",
            regionId:         "85d23a06-ca4c-41ba-8659-dc7b63a0b543",
            timeZone:         "Pacific Standard Time",
            city:             "Stanford",
            state:            "California",
            latitude:         37.4225,
            longitude:        -122.165278
        }, {
            id:               "8c53ebe7-13c7-4668-95cc-07284f5df98a",
            name:             "Franklin D. Roosevelt",
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            timeZone:         "Eastern Standard Time",
            city:             "Hyde Park",
            state:            "New York",
            latitude:         41.783333,
            longitude:        -73.9
        }, {
            id:               "2126816f-4431-4c9d-becc-e7eee564ca0e",
            name:             "Harry S. Truman",
            regionId:         "9d376648-d624-4df5-a183-055c77267154",
            timeZone:         "Central Standard Time",
            city:             "Kansas City",
            state:            "Missouri",
            latitude:         39.099722,
            longitude:        -94.578333
        }, {
            id:               "4a0c938e-8c43-4b8c-be48-2543074941e6",
            name:             "Dwight D. Eisenhower",
            regionId:         "85d23a06-ca4c-41ba-8659-dc7b63a0b543",
            timeZone:         "Eastern Standard Time",
            city:             "Gettysburg",
            state:            "Pennsylvania",
            latitude:         39.828333,
            longitude:        -77.232222
        }, {
            id:               "0cf696ab-2dcf-4457-8f74-30c113a3d641",
            name:             "John F. Kennedy",
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            timeZone:         "Eastern Standard Time",
            city:             "Hyannis",
            state:            "Massachusetts",
            latitude:         41.652778,
            longitude:        -70.283333
        }, {
            id:               "d86c5733-a890-44d1-bf64-943f6091091e",
            name:             "Lyndon B. Johnson",
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            timeZone:         "Eastern Standard Time",
            city:             "Washington",
            state:            "D.C.",
            latitude:         38.904722,
            longitude:        -77.016389
        }, {
            id:               "ff1184a3-d09b-43a0-ba9c-a1f0b48b9420",
            name:             "Richard Nixon",
            regionId:         "85d23a06-ca4c-41ba-8659-dc7b63a0b543",
            timeZone:         "Eastern Standard Time",
            city:             "Park Ridge",
            state:            "New Jersey",
            latitude:         41.036301,
            longitude:        -74.043561
        }, {
            id:               "62c0bf3f-524f-49cc-82e4-fd4f06af10a1",
            name:             "Gerald Ford",
            regionId:         "9d376648-d624-4df5-a183-055c77267154",
            timeZone:         "Pacific Standard Time",
            city:             "Rancho Mirage",
            state:            "California",
            latitude:         33.769167,
            longitude:        -116.421111
        }, {
            id:               "645f1f4b-4c85-4ef8-9675-491a91c885cb",
            name:             "Jimmy Carter",
            regionId:         "e9becb12-212a-47fd-8b32-d80f8f40f2d2",
            timeZone:         "Eastern Standard Time",
            city:             "Plains",
            state:            "Georgia",
            latitude:         32.033611,
            longitude:        -84.393333
        }, {
            id:               "7d652ae0-7b68-4758-920e-837d790e8a9a",
            name:             "Ronald Reagan",
            regionId:         "9d376648-d624-4df5-a183-055c77267154",
            timeZone:         "Pacific Standard Time",
            city:             "Santa Barbara",
            state:            "California",
            latitude:         34.425833,
            longitude:        -119.714167
        }, {
            id:               "5772cfe2-471d-4464-bdf7-2b2664d6ae9e",
            name:             "George H. W. Bush",
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            timeZone:         "Eastern Standard Time",
            city:             "Kennebunkport",
            state:            "Maine",
            latitude:         43.380833,
            longitude:        -70.451944
        }, {
            id:               "fbf69c5e-2213-4238-8f30-561f0ef11075",
            name:             "Bill Clinton",
            regionId:         "29dfbda4-1fbf-46ba-88d3-037a002d6556",
            timeZone:         "Eastern Standard Time",
            city:             "Georgetown",
            state:            "Washington, D.C.",
            latitude:         38.909444,
            longitude:        -77.065
        }, {
            id:               "a8d23b26-8808-47da-b2ce-292e6397e51a",
            name:             "George W. Bush",
            regionId:         "9d376648-d624-4df5-a183-055c77267154",
            timeZone:         "Central Standard Time",
            city:             "Crawford",
            state:            "Texas",
            latitude:         31.534444,
            longitude:        -97.443889
        }, {
            id:               "890a1c42-1271-4a48-a82b-3f1199efa871",
            name:             "Barack Obama",
            regionId:         "85d23a06-ca4c-41ba-8659-dc7b63a0b543",
            timeZone:         "Central Standard Time",
            city:             "Kenwood, Chicago",
            state:            "Illinois",
            latitude:         41.81,
            longitude:        -87.6
        }
    ];

    function toTz(entity) {
        var code, name, ui;

        if (!entity) {
            return null;
        }

        if (!entity.timeZone) {
            return null;
        }

        code = entity.timeZone.length + entity.timeZone.charCodeAt(0);
        name = entity.timeZone;
        ui   = entity.timeZone;
        return ARS.Models.TimeZone.getOrCreate(name, ui, code);
    }

    function toViewModel(entity) {
        var latLng, viewModel;

        latLng = ARS.Models.LatLng
            .tryCreate(entity.latitude, entity.longitude);

        viewModel = new ARS.Models.Technician();
        viewModel.technicianId = entity.id;
        viewModel.city         = entity.city;
        viewModel.state        = entity.state;
        viewModel.latLng       = latLng;
        viewModel.name         = entity.name;
        viewModel.timeZone     = toTz(entity);

        return viewModel;
    }

    function technicianMatchesRegion(regionFilter) {
        var selected;

        selected = regionFilter.getSelected().map(function (guid) {
            return guid.toLowerCase();
        });

        return function (technician) {
            var regionId = technician.regionId.toLowerCase();
            return selected.indexOf(regionId) !== -1;
        };
    }

    function FakeTechnicianService() {
        return undefined;
    }

    FakeTechnicianService.prototype.getTechniciansAsync = function (filters) {
        var hasRegion, result;

        hasRegion =
            $.isArray(filters) &&
            filters[0] instanceof ARS.Filters.RegionFilter;

        if (hasRegion === false) {
            result = technicians.map(toViewModel);
            return Promise.resolve(result);
        }

        result = filters[0];
        result = technicianMatchesRegion(result);
        result = technicians.filter(result);
        result = result.map(toViewModel);
        return Promise.resolve(result);
    };

    FakeTechnicianService.getById = function (technicianId) {
        var entity;

        entity = technicians.first(function (tech) {
            return tech.id === technicianId;
        });

        return entity ? toViewModel(entity) : null;
    };

    return FakeTechnicianService;
}());
