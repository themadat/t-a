# Handoff

Version 1.0.0.3: dedicated transparent browser favicons remove Safari's white backing; Masters has a gold outline and Basic a bright mint outline. Rounded monogram and in-app icons retained. Favicon routing lives in config/pwa; both new SVGs are in the offline shell and public deployment. Previous release frozen.
Verification: 95 tests, JavaScript syntax, manifests, deployment staging, and diff checks pass. Final favicon artwork checked directly in desktop Safari: neither skin has white backing. Adaptive media-query artwork was rejected after Safari rendered it with white backing; final tab assets use static bright colors. Physical-phone and Safari light-appearance checks remain unverified.
No agent commit/push. Temporary Safari preview window closed and preview server stopped. Preserve unrelated private data and icon artwork.
