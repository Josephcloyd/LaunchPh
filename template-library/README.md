# GetLaunch PH template library

Place source samples in the matching `samples/` folder. Keep supporting images and fonts in `assets/`, approved thumbnails in `previews/`, and editable-field definitions in `manifests/`.

Accepted references: PDF, DOCX, PNG, JPG, HTML, CSS, and ZIP. A source file is never assumed to be editable. Import it from the administrator dashboard, inspect the extracted metadata, map editable regions, validate the preview, and only then publish it.

Uploaded HTML and JavaScript must never run in the main application context. Store sources privately, validate type and size on the server, scan files before processing, sanitize HTML, and render previews inside a restricted sandbox without script permissions.
