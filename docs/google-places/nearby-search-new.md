# Nearby Search (New)

Select platform: [Android](https://developers.google.com/maps/documentation/places/android-sdk/nearby-search 'View this page for the Android platform docs.') [iOS](https://developers.google.com/maps/documentation/places/ios-sdk/nearby-search 'View this page for the iOS platform docs.') [JavaScript](https://developers.google.com/maps/documentation/javascript/nearby-search 'View this page for the JavaScript platform docs.') [Web Service](https://developers.google.com/maps/documentation/places/web-service/nearby-search 'View this page for the Web Service platform docs.') **European Economic Area (EEA) developers**

> [!NOTE]
> If your billing address is in the European Economic Area, effective on 8 July 2025, the [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea) will apply to your use of the Services. Functionality varies by region. [Learn more](https://developers.google.com/maps/comms/eea/faq).

## Introduction

A [Nearby Search (New)](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchNearby) request takes one or more place types, and returns a list of matching places within the specified area. A field mask specifying one or more data types is required. Nearby Search (New) only supports POST requests.

The APIs Explorer lets you make live requests so that you can get familiar with the API and the API options: [Try it!](https://developers.google.com/maps/documentation/places/web-service/nearby-search#try_it)

Try the [interactive demo](https://places-search-405409.ue.r.appspot.com/) to see Nearby Search (New) results displayed on a map.

## Nearby Search (New) requests

A Nearby Search (New) request is an HTTP POST request to:

```text
https://places.googleapis.com/v1/places:searchNearby
```

Pass all parameters in the JSON request body or in headers as part of the POST request. For example:

```curl
curl -X POST -d '{
  "includedTypes": ["restaurant"],
  "maxResultCount": 10,
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 37.7937,
        "longitude": -122.3965},
      "radius": 500.0
    }
  }
}' \
-H 'Content-Type: application/json' -H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.displayName" \
https://places.googleapis.com/v1/places:searchNearby
```

## Nearby Search (New) responses

Nearby Search (New) returns a [JSON object as a response](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchNearby#response-body). In the response:

- The `places` array contains all matching places.
- Each place in the array is represented by a [`Place`](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places) object.
- The [FieldMask](https://developers.google.com/maps/documentation/places/web-service/nearby-search#fieldmask) passed in the request specifies the list of fields returned in the `Place` object.

The complete JSON object is in the form:

```json
{
  "places": [
    {
      object (Place)
    }
  ]
}
```

## Required parameters

### FieldMask

Specify the list of fields to return in the response by creating a [response field mask](https://developers.google.com/maps/documentation/places/web-service/choose-fields). Pass the response field mask by URL parameter `$fields` or `fields`, or by using the HTTP header `X-Goog-FieldMask`.

There is no default list of returned fields in the response. If you omit the field mask, the method returns an error.

```text
X-Goog-FieldMask: places.displayName,places.formattedAddress
```

> [!NOTE]
> Spaces are not allowed anywhere in the field list.

Use `*` to retrieve all fields:

```text
X-Goog-FieldMask: *
```

> [!NOTE]
> While wildcard is fine in development, Google discourages wildcard in production because it may return large payloads.

For a complete field catalog by SKU tier, see [Place Data Fields (New)](./place-data-fields-new.md).

You can request fields across these billing tiers:

- Nearby Search Pro SKU fields include:
  `places.accessibilityOptions`, `places.addressComponents`, `places.addressDescriptor`, `places.adrFormatAddress`, `places.attributions`, `places.businessStatus`, `places.containingPlaces`, `places.displayName`, `places.formattedAddress`, `places.googleMapsLinks`, `places.googleMapsUri`, `places.iconBackgroundColor`, `places.iconMaskBaseUri`, `places.id`, `places.location`, `places.name`, `places.movedPlace`, `places.movedPlaceId`, `places.openingDate`, `places.photos`, `places.plusCode`, `places.postalAddress`, `places.primaryType`, `places.primaryTypeDisplayName`, `places.pureServiceAreaBusiness`, `places.shortFormattedAddress`, `places.subDestinations`, `places.timeZone`, `places.types`, `places.utcOffsetMinutes`, `places.viewport`
- Nearby Search Enterprise SKU fields include:
  `places.currentOpeningHours`, `places.currentSecondaryOpeningHours`, `places.internationalPhoneNumber`, `places.nationalPhoneNumber`, `places.priceLevel`, `places.priceRange`, `places.rating`, `places.regularOpeningHours`, `places.regularSecondaryOpeningHours`, `places.userRatingCount`, `places.websiteUri`
- Nearby Search Enterprise + Atmosphere SKU fields include:
  `places.allowsDogs`, `places.curbsidePickup`, `places.delivery`, `places.dineIn`, `places.editorialSummary`, `places.evChargeAmenitySummary`, `places.evChargeOptions`, `places.fuelOptions`, `places.generativeSummary`, `places.goodForChildren`, `places.goodForGroups`, `places.goodForWatchingSports`, `places.liveMusic`, `places.menuForChildren`, `places.neighborhoodSummary`, `places.parkingOptions`, `places.paymentOptions`, `places.outdoorSeating`, `places.reservable`, `places.restroom`, `places.reviews`, `places.reviewSummary`, `routingSummaries`, `places.servesBeer`, `places.servesBreakfast`, `places.servesBrunch`, `places.servesCocktails`, `places.servesCoffee`, `places.servesDessert`, `places.servesDinner`, `places.servesLunch`, `places.servesVegetarianFood`, `places.servesWine`, `places.takeout`

### locationRestriction

The region to search specified as a circle, defined by center point and radius in meters.
The radius must be between 0.0 and 50000.0, inclusive. Default radius is 0.0, and must be set to > 0.0 in practice.

```json
"locationRestriction": {
  "circle": {
    "center": {
      "latitude": 37.7937,
      "longitude": -122.3965
    },
    "radius": 500.0
  }
}
```

## Optional parameters

### includeFutureOpeningBusinesses

If `true`, returns businesses expected to open in the future. Defaults to `false`.
To retrieve business status, include `places.businessStatus` in field mask.
To retrieve anticipated opening date, include `places.openingDate` in field mask.

### includedTypes/excludedTypes, includedPrimaryTypes/excludedPrimaryTypes

Use type filters from [Table A](https://developers.google.com/maps/documentation/places/web-service/place-types#table-a). Up to 50 types can be specified in each category.

> [!NOTE]
> Values in [Table B](https://developers.google.com/maps/documentation/places/web-service/place-types#table-b) are response-only for Nearby Search filters.

- `includedPrimaryTypes` and `excludedPrimaryTypes` filter by a place's single primary type.
- `includedTypes` and `excludedTypes` filter by the full list of types associated with a place.
- If a type appears in both include/exclude lists, request can fail (`INVALID_REQUEST` or `INVALID_ARGUMENT`).

If all type filters are omitted, search returns places of all types within the location restriction.

### languageCode

The language in which to return results.

- If omitted, defaults to `en`.
- Invalid language code returns `INVALID_ARGUMENT`.
- Language preference can influence address formatting and result ordering.

### maxResultCount

Maximum number of place results to return. Must be between 1 and 20 (default), inclusive.

### rankPreference

Ranking mode:

- `POPULARITY` (default)
- `DISTANCE`

### regionCode

Two-character CLDR region code used to format response. No default.

- If `formattedAddress` country matches `regionCode`, country may be omitted from `formattedAddress`.
- No effect on `adrFormatAddress` (always includes country) and `shortFormattedAddress` (never includes country).

## Nearby Search (New) examples

### Find places of one type

```curl
curl -X POST -d '{
  "includedTypes": ["restaurant"],
  "maxResultCount": 10,
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 37.7937,
        "longitude": -122.3965},
      "radius": 500.0
    }
  }
}' \
-H 'Content-Type: application/json' -H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.displayName" \
https://places.googleapis.com/v1/places:searchNearby
```

Add fields such as `places.formattedAddress,places.types,places.websiteUri` for more details.

### Find places of multiple types

```curl
curl -X POST -d '{
  "includedTypes": ["liquor_store", "convenience_store"],
  "maxResultCount": 10,
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 37.7937,
        "longitude": -122.3965
      },
      "radius": 1000.0
    }
  }
}' \
-H 'Content-Type: application/json' -H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.displayName,places.primaryType,places.types" \
https://places.googleapis.com/v1/places:searchNearby
```

### Exclude a place type from a search

```curl
curl -X POST -d '{
  "includedTypes": ["school"],
  "excludedTypes": ["primary_school"],
  "maxResultCount": 10,
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 37.7937,
        "longitude": -122.3965
      },
      "radius": 1000.0
    }
  },
  "rankPreference": "DISTANCE"
}' \
-H 'Content-Type: application/json' -H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.displayName" \
https://places.googleapis.com/v1/places:searchNearby
```

### Search all places by distance

```curl
curl -X POST -d '{
  "maxResultCount": 10,
  "rankPreference": "DISTANCE",
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 37.7937,
        "longitude": -122.3965
      },
      "radius": 1000.0
    }
  }
}' \
-H 'Content-Type: application/json' -H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.displayName" \
https://places.googleapis.com/v1/places:searchNearby
```

### Get address descriptors

```curl
curl -X POST -d '{
  "maxResultCount": 5,
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 37.321328,
        "longitude": -121.946275
      },"radius": 1000
    }
  },
  "includedTypes": ["restaurant", "cafe"],
  "excludedTypes": [],
  "rankPreference":"POPULARITY"
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.displayName,places.addressDescriptor" \
https://places.googleapis.com/v1/places:searchNearby
```

### Find businesses opening in the future

```curl
curl -X POST \
-H "Content-Type: application/json" \
-H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.id,places.displayName,places.businessStatus,places.openingDate" \
-d '{
  "includeFutureOpeningBusinesses": true,
  "maxResultCount": 20,
  "locationRestriction": {
    "circle": {
      "center": {"latitude": 44.9755100, "longitude": -116.2842180},
      "radius": 20
    }
  },
  "rankPreference": "DISTANCE"
}' \
"https://places.googleapis.com/v1/places:searchNearby"
```

## Try it!

The APIs Explorer lets you make sample requests:

1. Select the API icon on the right side of the page.
2. Optionally edit request parameters.
3. Select **Execute** and choose the account.
4. Use fullscreen icon in APIs Explorer to expand the panel.
