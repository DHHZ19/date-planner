# Place Data Fields (New)

Source: https://developers.google.com/maps/documentation/places/web-service/data-fields

Select platform: [Android](https://developers.google.com/maps/documentation/places/android-sdk/data-fields 'View this page for the Android platform docs.') [iOS](https://developers.google.com/maps/documentation/places/ios-sdk/data-fields 'View this page for the iOS platform docs.') [JavaScript](https://developers.google.com/maps/documentation/javascript/place-class-data-fields 'View this page for the JavaScript platform docs.') [Web Service](https://developers.google.com/maps/documentation/places/web-service/data-fields 'View this page for the Web Service platform docs.')

<br />

**European Economic Area (EEA) developers**

> [!NOTE]
> If your billing address is in the European Economic Area, effective on 8 July 2025, the [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea) will apply to your use of the Services. Functionality varies by region. [Learn more](https://developers.google.com/maps/comms/eea/faq).

## Introduction

Place data fields define the place data to return in the response for [Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details), [Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search), and [Nearby Search (New)](https://developers.google.com/maps/documentation/places/web-service/nearby-search).

In the request, specify the list of fields to return (the **field mask** or **field list**). If you omit the field mask, the call returns an error.

This page is an in-repo reference of the field names and SKU tiers used by the Places API (New). Use the official page above as the source of truth for updates.

## Field mask quick rules

- Always send `X-Goog-FieldMask` with one or more fields.
- Do not include spaces in the comma-separated field list.
- Use `*` only for development/debugging.
- Keep requested fields aligned with what the app actually reads.

## Field catalog (from Google docs)

| Field description               | Property field                 | Place Details SKU                     | Text Search SKU                     | Nearby Search SKU                     |
| ------------------------------- | ------------------------------ | ------------------------------------- | ----------------------------------- | ------------------------------------- |
| Accessibility options           | `accessibilityOptions`         | Place Details Pro                     | Text Search Pro                     | Nearby Search Pro                     |
| Address components              | `addressComponents`            | Place Details Essentials              | Text Search Pro                     | Nearby Search Pro                     |
| Address descriptor              | `addressDescriptor`            | Place Details Essentials              | Text Search Pro                     | Nearby Search Pro                     |
| Address (ADR microformat)       | `adrFormatAddress`             | Place Details Essentials              | Text Search Pro                     | Nearby Search Pro                     |
| Allows dogs                     | `allowsDogs`                   | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Attributions                    | `attributions`                 | Place Details Essentials (IDs Only)   | Text Search Essentials (IDs Only)   | Nearby Search Pro                     |
| Business status                 | `businessStatus`               | Place Details Pro                     | Text Search Pro                     | Nearby Search Pro                     |
| Containing places               | `containingPlaces`             | Place Details Pro                     | Text Search Pro                     | Nearby Search Pro                     |
| Curbside pickup                 | `curbsidePickup`               | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Current opening hours           | `currentOpeningHours`          | Place Details Enterprise              | Text Search Enterprise              | Nearby Search Enterprise              |
| Current secondary opening hours | `currentSecondaryOpeningHours` | Place Details Enterprise              | Text Search Enterprise              | Nearby Search Enterprise              |
| Delivery                        | `delivery`                     | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Dine in                         | `dineIn`                       | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Display name                    | `displayName`                  | Place Details Pro                     | Text Search Pro                     | Nearby Search Pro                     |
| Editorial summary               |                                | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| AI-powered EVCS amenity summary | `evChargeAmenitySummary`       | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| EV charging options             | `evChargeOptions`              | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Formatted address               | `formattedAddress`             | Place Details Essentials              | Text Search Pro                     | Nearby Search Pro                     |
| Fuel options                    | `fuelOptions`                  | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| AI-powered place summary        | `generativeSummary`            | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Good for children               | `goodForChildren`              | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Good for groups                 | `goodForGroups`                | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Good for watching sports        | `goodForWatchingSports`        | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Google Maps links               | `googleMapsLinks`              | Place Details Pro                     | Text Search Pro                     | Nearby Search Pro                     |
| Google Maps URI                 | `googleMapsUri`                | Place Details Pro                     | Text Search Pro                     | Nearby Search Pro                     |
| Icon background color           | `iconBackgroundColor`          | Place Details Pro                     | Text Search Pro                     | Nearby Search Pro                     |
| Icon mask base URI              | `iconMaskBaseUri`              | Place Details Pro                     | Text Search Pro                     | Nearby Search Pro                     |
| International phone number      | `internationalPhoneNumber`     | Place Details Enterprise              | Text Search Enterprise              | Nearby Search Enterprise              |
| Live music                      | `liveMusic`                    | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Location                        | `location`                     | Place Details Essentials              | Text Search Pro                     | Nearby Search Pro                     |
| Menu for children               | `menuForChildren`              | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Name                            | `name`                         | Place Details Essentials (IDs Only)   | Text Search Essentials (IDs Only)   | Nearby Search Pro                     |
| National phone number           | `nationalPhoneNumber`          | Place Details Enterprise              | Text Search Enterprise              | Nearby Search Enterprise              |
| AI-powered neighborhood summary | `neighborhoodSummary`          | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Next page token                 | `nextPageToken`                | -                                     | Text Search Essentials (IDs Only)   | -                                     |
| Opening date                    | `openingDate`                  | Place Details Pro                     | Text Search Pro                     | Nearby Search Pro                     |
| Outdoor seating                 | `outdoorSeating`               | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Parking options                 | `parkingOptions`               | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Payment options                 | `paymentOptions`               | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Photos                          | `photos`                       | Place Details Essentials (IDs Only)   | Text Search Pro                     | Nearby Search Pro                     |
| Place ID                        | `id`                           | Place Details Essentials (IDs Only)   | Text Search Essentials (IDs Only)   | Nearby Search Pro                     |
| Plus code                       | `plusCode`                     | Place Details Essentials              | Text Search Pro                     | Nearby Search Pro                     |
| Postal address                  | `postalAddress`                | Place Details Essentials              | Text Search Pro                     | Nearby Search Pro                     |
| Price level                     | `priceLevel`                   | Place Details Enterprise              | Text Search Enterprise              | Nearby Search Enterprise              |
| Price range                     | `priceRange`                   | Place Details Enterprise              | Text Search Enterprise              | Nearby Search Enterprise              |
| Primary type                    | `primaryType`                  | Place Details Pro                     | Text Search Pro                     | Nearby Search Pro                     |
| Primary type display name       | `primaryTypeDisplayName`       | Place Details Pro                     | Text Search Pro                     | Nearby Search Pro                     |
| Pure service area business      | `pureServiceAreaBusiness`      | Place Details Pro                     | Text Search Pro                     | Nearby Search Pro                     |
| Rating                          | `rating`                       | Place Details Enterprise              | Text Search Enterprise              | Nearby Search Enterprise              |
| Regular opening hours           | `regularOpeningHours`          | Place Details Enterprise              | Text Search Enterprise              | Nearby Search Enterprise              |
| Regular secondary opening hours | `regularSecondaryOpeningHours` | Place Details Enterprise              | Text Search Enterprise              | Nearby Search Enterprise              |
| Reservable                      | `reservable`                   | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Restroom                        | `restroom`                     | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Reviews                         | `reviews`                      | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| AI-powered review summary       | `reviewSummary`                | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Routing summaries               | `routingSummaries`             | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Serves beer                     | `servesBeer`                   | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Serves breakfast                | `servesBreakfast`              | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Serves brunch                   | `servesBrunch`                 | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Serves cocktails                | `servesCocktails`              | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Serves coffee                   | `servesCoffee`                 | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Serves dessert                  | `servesDessert`                | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Serves dinner                   | `servesDinner`                 | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Serves lunch                    | `servesLunch`                  | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Serves vegetarian food          | `servesVegetarianFood`         | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Serves wine                     | `servesWine`                   | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Short formatted address         | `shortFormattedAddress`        | Place Details Essentials              | Text Search Pro                     | Nearby Search Pro                     |
| Sub-destinations                | `subDestinations`              | Place Details Pro                     | Text Search Pro                     | Nearby Search Pro                     |
| Types                           | `types`                        | Place Details Essentials              | Text Search Pro                     | Nearby Search Pro                     |
| Takeout                         | `takeout`                      | Place Details Enterprise + Atmosphere | Text Search Enterprise + Atmosphere | Nearby Search Enterprise + Atmosphere |
| Time zone                       | `timeZone`                     | Place Details Pro                     | Text Search Pro                     | Nearby Search Pro                     |
| User rating count               | `userRatingCount`              | Place Details Enterprise              | Text Search Enterprise              | Nearby Search Enterprise              |
| UTC offset (minutes)            | `utcOffsetMinutes`             | Place Details Pro                     | Text Search Pro                     | Nearby Search Pro                     |
| Viewport                        | `viewport`                     | Place Details Essentials              | Text Search Pro                     | Nearby Search Pro                     |
| Website URI                     | `websiteUri`                   | Place Details Enterprise              | Text Search Enterprise              | Nearby Search Enterprise              |

## AI-powered place summaries

AI-powered place summaries are brief, 100-character overviews specific to a given place ID. Place summaries aggregate many different types of data into a high-level overview to help users get a snapshot of a place.

For example, place summaries may highlight popular foods, services, or goods available for purchase at a location:

- _"Forum Shops eatery serving large portions of traditional Italian fare in a casual space."_
- _"Stylish salon offering haircuts and coloring, plus blowouts."_
- _"Large store with many vendors offering a variety of vintage decor, furniture, and clothing."_

Place summaries are supported by [Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details), [Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search), and [Nearby Search (New)](https://developers.google.com/maps/documentation/places/web-service/nearby-search).

Place summaries are available for place types shown in [Supported types](https://developers.google.com/maps/documentation/places/web-service/place-types) for the categories **Culture**, **Entertainment and Recreation**, **Food and Drink**, **Shopping**, **Services**, and **Sports**.

Place summaries are supported for points of interest in the following languages and regions:

| Language | Region               |
| -------- | -------------------- |
| English  | India, United States |

> [!NOTE]
> Place summaries are not guaranteed for all places.

[Try the AI-powered summaries demo](https://mapsplatform.google.com/gemini-placesapi-demo/)

### Request a generative place summary

To return a place summary in the response, include the following field in the [field mask](https://developers.google.com/maps/documentation/places/web-service/choose-fields) of the request:

- **Place Details (New):** `generativeSummary`
- **Text Search (New)** and **Nearby Search (New):** `places.generativeSummary`

The [generativeSummary](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places#generativesummary) field contains the following fields:

- `generativeSummary`: The place summary.
- [`overviewFlagContentUri`](https://developers.google.com/maps/documentation/places/web-service/content-reporting): A link where users can flag a problem with the place summary.
- `disclosureText`: A localized text string with the disclosure text "Summarized with Gemini" that must be incorporated in attributions.

### Place Details (New) request

The following Place Details (New) request returns an `overview` summary for a sushi restaurant in Chicago, IL:

```bash
curl -X GET https://places.googleapis.com/v1/places/ChIJ1eOF7HLTD4gRry3xPjk8DkU \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: displayName,generativeSummary"
```

The response is in the form:

```json
{
  "displayName": {
    "text": "Sushi Nova - Lincoln Park",
    "languageCode": "en"
  },
  "generativeSummary": {
    "overview": {
      "text": "Casual eatery with all-you-can-eat sushi and other Japanese fare, plus beer and sake.",
      "languageCode": "en-US"
    },
    "overviewFlagContentUri": "https://www.google.com/local/review/rap/report?postId=CiUweDg4MGZkMzcyZWM4NWUzZDU6MHg0NTBlM2MzOTNlZjEyZGFmMAI&d=17924085&t=12",
    "disclaimerText": {
      "text": "Summarized with Gemini",
      "languageCode": "en-US"
    }
  }
}
```

### Text Search (New) request

The following Text Search (New) request returns an `overview` summary for spicy vegetarian restaurants in Mountain View, CA:

```bash
curl -X POST -d '{
	"textQuery": "Spicy Vegetarian Food",
	"location_bias": {
		"rectangle": {
			"low": {
				"latitude": 37.415,
				"longitude": -122.091
			},
			"high": {
				"latitude": 37.429,
				"longitude": -122.065
			}
		}
	},
	"maxResultCount": 5
}' \
-H 'Content-Type: application/json' -H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.id,places.displayName,places.generativeSummary" \
'https://places.googleapis.com/v1/places:searchText'
```

The response is in the form:

```json
{
	"places": [
		{
			"id": "ChIJ8wN5kzm3j4AR_dRdUHoqrPI",
			"displayName": {
				"text": "Plant-Based Vegan Vietnamese",
				"languageCode": "en"
			}
		},
		{
			"id": "ChIJw4RuczO3j4ARC7RByZ5K9nI",
			"displayName": {
				"text": "sweetgreen",
				"languageCode": "en"
			},
			"generativeSummary": {
				"overview": {
					"text": "Casual eatery offering healthy, made-to-order salads, plates, and grain bowls with vegan options.",
					"languageCode": "en-US"
				},
				"overviewFlagContentUri": "https://www.google.com/local/review/rap/report?postId=CiUweDgwOGZiNzMzNzM2ZTg0YzM6MHg3MmY2NGE5ZWM5NDFiNDBiMAI&d=17924085&t=12",
				"disclosureText": {
					"text": "Summarized with Gemini",
					"languageCode": "en-US"
				}
			}
		},
		/.../
	]
}
```

### Nearby Search (New) request

The following Nearby Search (New) request returns an `overview` summary for restaurants and cafes in Portland, OR:

```bash
curl -X POST -d '{
	"maxResultCount": 5,
	"locationRestriction": {
		"circle": {
			"center": {
				"latitude": 45.553360,
				"longitude": -122.674934
			},
			"radius": 1000
		}
	},
	"includedTypes": ["restaurant", "cafe"],
	"excludedTypes": [],
	"rankPreference":"POPULARITY"
}' \
-H 'Content-Type: application/json' -H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.id,places.generativeSummary" \
'https://places.googleapis.com/v1/places:searchNearby'
```

The response is in the form:

```json
{
	"places": [
		{
			"id": "ChIJOa08KlqnlVQR_ZZx1jEcTYY",
			"generativeSummary": {
				"overview": {
					"text": "BBQ and Thai street fare, plus imaginative tropical cocktails, served in a vibrant space.",
					"languageCode": "en-US"
				},
				"disclosureText": {
					"text": "Summarized with Gemini",
					"languageCode": "en-US"
				}
			}
		},
		{
			"id": "ChIJU4OzoWynlVQRxlQMpGenSvA",
			"generativeSummary": {
				"overview": {
					"text": "Beer hall with a big selection of German brews, plus a central courtyard with food trucks.",
					"languageCode": "en-US"
				},
				"disclosureText": {
					"text": "Summarized with Gemini",
					"languageCode": "en-US"
				}
			}
		},
		/.../
	]
}
```

### Attributions

All AI-powered summaries displayed in your app must be accompanied by the appropriate attribution in accordance with Google's policies and standards. For more information, see [Policies for Places API](https://developers.google.com/maps/documentation/places/web-service/policies#ai-powered_summaries).

## Project usage note

In this project, the server request field mask lives in the server function implementation. Keep that constant synchronized with the fields consumed by UI types and renderers.

Related docs:

- [Nearby Search (New)](./nearby-search-new.md)
- [Place Types (New)](./place-types-new.md)
