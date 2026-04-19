# Current Non-Functional Rules and Format Limits

This document tracks format rules that are not currently functionable in the active browser-first stack.

## Active Engine Stack (Enforced)

- Native browser engine (0 bytes): text utilities, UI logic, and browser-native image/PDF interactions.
- PDF engine (`pdf-lib`, lightweight browser profile): merge, split/extract pages, rotate, crop, resize, flatten, protect/unlock, organize.
- Video and audio engine (`ffmpeg.wasm`, heavy first load): video/audio convert, compress, trim/crop, and GIF workflows.
- Advanced image engine (browser-safe image processing profile): convert/compress/resize/crop/rotate/flip/enlarge with browser-decodable formats.
- Developer and text tools (zero-library or regex-based): deterministic, no heavy runtime dependencies.

## Supported Public Format Classes

- Video: MP4, MOV, MKV, AVI, WEBM, MPEG.
- Audio: MP3, WAV, OGG, AAC, FLAC, M4A.
- Image: PNG, JPG/JPEG, WEBP, GIF, SVG, AVIF, BMP, JFIF.
- PDF profile: PDF plus JPG/JPEG/PNG image ingestion flows for browser PDF operations.
- Archive profile: ZIP only (reserved profile; no public archive conversion route active).

## Rules Not Functioning Properly Right Now

- Desktop-only document conversion rule
  - PDF, DOCX, and EPUB high-fidelity conversion workflows require desktop engines and are not enabled in the active browser-only convert surface.

- HEIC in-browser reliability rule
  - HEIC and HEIF conversion support is not consistent across browsers, codecs, and devices.

- Generic wildcard converter rule
  - Broad converter routes (for example generic video/image/document converter pages) can produce unsupported input-output combinations and are currently disabled from the convert surface.

- Archive conversion rule
  - Multi-format archive conversion still depends on desktop-oriented archive toolchains.

- Desktop PDF image extraction binary rule
  - `extract-image-from-pdf` requires desktop `pdfimages` tooling and has been removed from the active public catalog.

## File Formats Not Functionable (Current Stack)

- HEIC and HEIF conversion routes (disabled due decode reliability constraints).
- PDF to DOCX direct browser conversion.
- DOCX to PDF office-fidelity conversion.
- EPUB to PDF and PDF to EPUB conversion.
- General archive format conversion workflows.
