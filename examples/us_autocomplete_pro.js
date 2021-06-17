const SmartyStreetsSDK = require("smartystreets-javascript-sdk");
const SmartyStreetsCore = SmartyStreetsSDK.core;
const Lookup = SmartyStreetsSDK.usAutocompletePro.Lookup;

// US Autocomplete Pro only supports using Website Keys
let key = process.env.SMARTY_WEBSITE_KEY;
const credentials = new SmartyStreetsCore.SharedCredentials(key);

// The appropriate license values to be used for your subscriptions
// can be found on the Subscription page of the account dashboard.
// https://www.smartystreets.com/docs/cloud/licensing
let clientBuilder = new SmartyStreetsCore.ClientBuilder(credentials).withLicenses(["us-autocomplete-pro-cloud"]);
// .withBaseUrl("");
let client = clientBuilder.buildUsAutocompleteProClient();

// Documentation for input fields can be found at:
// https://smartystreets.com/docs/cloud/us-autocomplete-api#pro-http-request-input-fields


// *** Simple Lookup ***
let lookup = new Lookup("4770 Lincoln");

client.send(lookup)
	.then(function(results) { logSuggestions(results, "Simple Lookup") })
	.catch(console.log);


// *** Using Filter and Prefer ***
lookup = new Lookup("4770 Lincoln");

lookup.maxResults = 10;
lookup.includeOnlyCities = ["Chicago,La Grange,IL", "Blaine,WA"];
lookup.preferStates = ["IL"];
lookup.preferRatio = 33;

client.send(lookup)
	.then(function(results) { logSuggestions(results, "Using Filter and Prefer") })
	.catch(console.log);


// *** Using 'selected' to Expand Secondaries ***
lookup = new Lookup("4770 Lincoln");

lookup.selected = "4770 N Lincoln Ave Ste 2 (3) Chicago, IL 60625"

client.send(lookup)
	.then(function(results) { logSuggestions(results, "Using 'selected' to Expand Secondaries") })
	.catch(console.log);


// ************************************************

function logSuggestions(response, message) {
	console.log(message);
	console.log(response.result);
	console.log("*********************");
}