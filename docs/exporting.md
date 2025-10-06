# Exporting Visualization

Hemicycle view offers SVG and PNG export.

- PNG: Renders off-screen canvas with white background, preserving scale & locked state.
- Extend by adding new format branch in existing export utility pipeline.

Performance: Keep operations synchronous (<250ms). For heavier exports consider a progress UI.
