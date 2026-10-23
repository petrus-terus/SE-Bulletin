# Media Processing, Canvas & Storage Rules

> **Scope**: Triggered whenever touching image cropping, canvas manipulation, file compression, or media uploads in `client/src/utils/cropImage*`, `client/src/utils/imageCompressor*`, `client/src/ui/MediaCropModal*`, or `client/src/services/domains/mediaService.ts`.

---

## 1. Canvas Tainting & CORS-Clean Cropping Protocol
Whenever loading images for canvas processing (`drawImage`, `toBlob`, `toDataURL` in `cropImage.ts` or `MediaCropModal.tsx`):
1. **Local File Priority**: Always prioritize local device `File` objects by converting them to in-memory `data:` URLs via `FileReader.readAsDataURL()`. Local data URLs never make network calls and cannot taint the canvas.
2. **Remote URL Blob Conversion**: For remote URLs (Supabase Storage, CDNs), fetch the image via `fetch(src, { mode: 'cors' })` and convert to a local `blob:` URL (`URL.createObjectURL(blob)`).
3. **Disk Cache Collision Defense**: Set `crossOrigin = 'anonymous'` on `new Image()` and `<Cropper>` `mediaProps`, and append a cache-buster query parameter (`_cors=${Date.now()}`) to prevent the browser from reusing a non-CORS cached entry from an earlier `<img>` tag.
   - *This permanently prevents `SecurityError: Failed to execute 'toBlob' on 'HTMLCanvasElement': Tainted canvases may not be exported.`*

---

## 2. Client-Side Image Compression & Storage Bucket
- **Supabase Storage over Base64**: Never persist large raw base64 image strings into PostgreSQL table columns or `localStorage`.
- **Pre-Upload Compression**: Always run user uploads through `compressImage()` (`client/src/utils/imageCompressor.ts`) before uploading to the Supabase Storage bucket (`bulletin-media`).
  - Limits file sizes to < 500KB to prevent `QuotaExceededError` and guarantee fast mobile load times over cellular data.

---

## 3. Unified Media Crop Architecture (`MediaCropModal.tsx`)
- **Stories**: In-canvas "Crop & Frame" floating button, defaulted to `9:16` full-screen vertical portrait with freeform/ratio presets (`Original`, `1:1`, `4:5`, `16:9`).
- **Bulletins**: Sequential staging queue (`cropQueue`) on file selection with "Skip (Keep Original)" and on-demand thumbnail edit buttons.
- **Avatars**: Dedicated circular 1:1 modal in `AvatarCropSheet.tsx`. Both share the underlying `cropImageToBlob()` engine with 90° rotation support.
- **Creation Flow Decoupling**: Keep 24-hour casual stories and formal corporate bulletins strictly separated. Casual status/dispatches belong in `CreateStoryModal.tsx` (fast 3-second WhatsApp/IG style), while formal department circulars belong in `CreateBulletinPage.tsx` with SESB quick templates.
