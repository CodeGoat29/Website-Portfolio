# MTG Bulk Scanner

The scanner is a static, mobile-first page designed for iPhone Safari. One tap opens the rear camera, then the page continuously reads the card-name strip with on-device Tesseract OCR. Camera frames stay on the device.

## Bundled decks

`profile-decks.js` contains the seven public decks from the `codegoat29` Moxfield profile. Each deck includes its Moxfield URL plus separate mainboard, sideboard, and considering lists. The Decks screen fetches current Scryfall color and rarity metadata to organize those bundled lists for browsing.

Update `profile-decks.js` when the Moxfield profile changes. Moxfield does not provide a supported public, unauthenticated profile/deck import API, so the deployed deck snapshot is intentionally explicit rather than depending on a fragile runtime scrape.

## Card and price catalog

`catalog.json` was generated from Scryfall's Default Cards bulk data. Paper English cards are grouped by Oracle identity, allowing every printing of a card to match the same bundled deck entry. Each printing retains its set code, collector number, finish availability, and available USD prices. The bundled catalog is loaded when the page loads.

Cards present in the Moxfield snapshot but absent from the bulk catalog are added to the in-memory name index so OCR and deck matching still work; price data remains unavailable until the catalog is refreshed.

## Scanner settings

The configurable USD alert threshold and sound choices are saved in the browser. The default value threshold is $2. Deck lists and card matching are part of the deployed site and do not depend on browser storage.
