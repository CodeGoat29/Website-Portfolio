# Updating the Homelab page

The page uses the existing static website, shared stylesheet, navigation, and saved theme preference. No build step, backend, device access, or live monitoring is needed.

## Lab details

Edit `homelab/lab.json`. Keep it valid JSON (double quotes, no trailing commas).

- `lastUpdated`: manually change the date in `YYYY-MM-DD` format when you update the inventory.
- `overview`: introduction text.
- `equipment`: cards in display order. Each device has a unique `id`, `manufacturer`, `model`, `role`, `description`, manually recorded `status`, `photo`, `photoAlt`, and `photoCaption`.
- `connections`: diagram edges in display order. `from` and `to` refer to equipment IDs. Set `label` to explain the link and `status` to `Provisional`, `Planned`, or `Confirmed`. Only record `Confirmed` after you verify the connection. The switch uplink starts as `Planned`.
- `configuration`: empty initially. Add only features you have actually configured, using `{"name": "Feature name", "details": "Your recorded configuration"}`. VLANs, routing, DHCP, SSH, and ACLs are examples of future entries, not existing configuration.
- `services`: empty initially. Each future entry uses `{"name": "Service name", "purpose": "What it does", "host": "Your host name"}`.

Add servers or endpoints as equipment and add their connections to extend the diagram. The displayed diagram is your supplied image. Update `topology.image` and `topology.alt` when you replace it; editing connection records does not redraw the image.

## Photos

Put your photos in `images/homelab/`, then set a device's `photo` to a site-root path such as `/images/homelab/my-router.jpg`. Add meaningful `photoAlt` text and update `photoCaption`. Leave `photo` empty for the illustrated placeholder, or set `showPhoto` to `false` to omit the photo area entirely (as on the ONT). Missing images fall back to a placeholder. Photos retain their proportions.

The Cisco images are supplied product references, clearly labeled as such; replace them with personal equipment photos when ready. No specifications were inferred from those references.

## Related blog posts

The existing source of posts is `blog/index.html`. Add a normal `.blog-card` there with a title link, `.blog-date`, excerpt, and read-more link, using the same markup as existing cards. Give it either a `.blog-category` of `Homelab` or add `data-tags="homelab"` to the article (space- or comma-separated tags are supported, case-insensitively). The Homelab page automatically reuses matching cards, including their dates and excerpts. Keep links site-root relative, e.g. `/blog/your-post/`, and create the corresponding post page. No separate Homelab post list needs maintenance.

## Preview and publication

Serve the repository locally with `python3 -m http.server 8765 --bind 127.0.0.1`, then visit `http://127.0.0.1:8765/homelab/`. Opening the HTML as a file will not load fetched JSON/blog content.

Check mobile and desktop layouts, both themes, topology anchors, and any newly added blog links before publishing. This project already uses GitHub Pages; review the working tree before committing because it may contain unrelated work. Publishing is separate from this preview.
