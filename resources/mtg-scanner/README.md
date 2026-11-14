# MTG Bulk Scanner

The public scanner lives at `/resources/mtg-scanner/`. It is a static, mobile-first tool built for iPhone Safari and the existing dipiazza.org GitHub Pages site.

## Data and privacy

- Decks, owned counts, shopping counts, and settings are stored in the current browser with `localStorage`.
- The Scryfall catalog is cached in IndexedDB after the first load.
- Browser data is device-specific. Use **Export backup** and **Restore backup** in Settings to move it to another device.
- Camera frames stay in the browser. Tesseract.js performs OCR on the device and no frame upload is implemented.

## Deck imports

Moxfield does not publish a supported public deck-fetch API, and its terms prohibit automated scraping. The scanner starts with links to the public decks on the `codegoat29` profile and imports a deck's text export for card matching. Commander and mainboard are included by default; sideboard and maybeboard are optional. A failed re-import preserves the last successful import and all owned counts.

## Card catalog

`catalog.json` was generated from Scryfall's Default Cards bulk data. The bundled catalog contains paper English cards grouped by Oracle identity, so alternate printings match the same deck need. Each printing retains set code, collector number, finish availability, and available USD prices.

To refresh prices, download the current Default Cards bulk file from Scryfall, rebuild `catalog.json` in the same compact schema, and update the catalog timestamp. Follow Scryfall's published API and bulk-data guidance.

## Validation

Run:

```sh
node resources/mtg-scanner/core.test.cjs
node --check resources/mtg-scanner/core.js
node --check resources/mtg-scanner/app.js
```

The automated checks cover common Moxfield export lines, optional boards, unrecognized lines, count preservation, alternate-printing identity matches across two decks, scan-latch behavior retained in the core library, and foil/nonfoil price handling.

Camera OCR runs once per tap and leaves the camera open between cards. Speed depends on the iPhone model and lighting, so the scanner displays the last scan time for field measurement. Glare, foil surfaces, stylized title text, cards held at an angle, split or double-faced names, and low light are the main expected misread sources. Printing-footer OCR is optional because it is slower and less reliable than card-name recognition.
