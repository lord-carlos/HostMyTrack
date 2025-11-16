## HostMyTrack — AI Assistant Instructions

This repository is a small static site for hosting HLS (HTTP Live Streaming) audio tracks with a minimalist UI. The goal of this file is to give AI coding agents the context and rules needed to make productive changes.

### Quick architecture summary
- Type: Static frontend (HTML/CSS/JS). No backend.
- Playback: `index.html` loads `js/main.js` which:
  - reads `config.json` to get `baseURL` and `jsonURL`
  - fetches a JSON array of tracks from `jsonURL` (example: `example/example.json`)
  - filters and displays tracks in `#track-list` and uses Plyr + HLS.js to play them.
- Playlist relationship: Each track is expected as an HLS folder: `baseURL/<track-name-no-extension>/playlist.m3u8`.

### Key files to examine (start here)
- `index.html` — HTML shell, loads `js/plyr.js`, `js/hls.js`, and `js/main.js`.
- `js/main.js` — main UX & playback logic (most changes will happen here).
- `config.json` / `example.config.json` — runtime config used by `main.js`.
- `example/example.json` — sample track metadata (name, mtime, duration).
- `example/<track-folder>/playlist.m3u8` — example HLS playlists and `.ts` segments.
- `ffmpeg_hls.sh` — script for converting audio files (mkv) to HLS + updating `output.json`.

### Project-specific conventions and patterns
- JSON shape: the app expects JSON objects containing `name` (filename with extension), `mtime` (human-readable), and `duration` (seconds integer). Example: `{ "name": "no-place-to-go-216744.aac", "mtime": "2024-08-10 18:30:08", "duration": 337 }`.
- Track -> playlist mapping: `playlistUrl = baseURL + trackNameNoExtension + '/playlist.m3u8'`.
  - `trackNameNoExtension` is derived by removing file extension from `name`.
  - Ensure `baseURL` is configured so the concatenation yields a valid URL (recommended: always end `baseURL` with a trailing slash).
- Filtering tracks: `main.js` filters by extensions (`.mp3`, `.ogg`, `.wav`, `.aac`, `.m4a`, `.flac`). Modify the `commonAudioFormats` array in `main.js` to support new formats.
- UI behavior:
  - Tracks are generated dynamically with plain DOM APIs (no framework).
  - Clicking a track stops any current playback, detaches HLS.js (if used), and loads a new playlist.
  - The page uses `history.pushState` to add `?track=<name>` for sharing.

### Integration points & externals
- External libs used:
  - Plyr (local `js/plyr.js`) for UI controls.
  - HLS.js (`js/hls.js` is expected to be present locally; keep it updated to a recent release if you need feature/fix changes). A local copy is preferred over CDN for this project.
- HLS serving: HLS playlists and segments must be served over HTTP/HTTPS (file:// won't work). Use a simple static server locally for development.

### Local dev / validation workflow
1. Start a local HTTP server in the repo root (PowerShell examples):
   ```powershell
   # Python
   py -3 -m http.server 8000
   # Serve the example folder specifically
   py -3 -m http.server 5500 --directory example
   # or Node:
   npx http-server . -p 8000
   ```
2. Confirm `config.json` is configured correctly (e.g., `jsonURL` points to `/hls/output.json` or a reachable URL where `output.json` is served).
3. Open the site: `http://127.0.0.1:8000/` (or port you chose), open DevTools Network/Console.
4. Verify the app fetches `jsonURL` and that playlist URLs load (HTTP 200). Observe console logs in `main.js` that say either `HLS.js fallback` or `Native HLS support`.

### Docker support
This project ships with a Dockerfile (Nginx-based) and an example `docker-compose.example.yml` to quickly run the UI and serve a mount point for your HLS content. Key details:
- The container serves the UI at `/` and your shared music folder HLS content at `/hls` (mapped to `/srv/media/hls` in the container).
- Example `docker-compose` shows how to mount a single folder for music and add Traefik labels. `example.config.json` defaults to `baseURL: "/hls/"` and `jsonURL: "/hls/output.json"` so the UI is ready to work when the folder is mounted.
- To override `websiteName` in `config.json` at runtime you can set the `WEBSITE_NAME` environment variable in your docker-compose service. The entrypoint will update `config.json` accordingly.

### Building / generating HLS content
- The repo includes `ffmpeg_hls.sh`. Use a POSIX shell (WSL/Git Bash/macOS/Linux) to run it. It expects:
  - `ffmpeg`, `ffprobe`, `jq` installed.
  - The script currently converts `.mkv` files into HLS with `.aac` and creates `hls/<track>/playlist.m3u8` and `output.json`.
Example:
```bash
./ffmpeg_hls.sh /path/to/input/dir
``` 
After conversion, set `baseURL` to serve `.../hls/` and point `jsonURL` to the generated `output.json`.

### Debugging tips & frequent issues
If no audio plays:
  - Confirm `jsonURL` and/or `baseURL` (open those URLs in your browser to check contents). `jsonURL` should reference the `output.json` produced by `ffmpeg_hls.sh`, and `baseURL` usually points to `/hls/`.
  - Ensure `js/hls.js` is present and recent; the project prefers a local `js/hls.js` copy instead of a CDN.
  - Confirm segments are served and CORS headers (if using remote hosting) permit access.
- If the UI shows incorrect durations:
  - `main.js` formats durations using the `duration` field from JSON (`formatDuration`). Ensure the JSON `duration` is an integer seconds value.
  - HLS stream might not report a duration immediately; the player displays time based on either JSON or media metadata.
- If durations or mtime values are wrong, check `ffprobe` and `ffmpeg_hls.sh` for how values are extracted and rounded.
- For HLS errors, inspect console for HLS.js events; add hls.on(Hls.Events.ERROR, ... ) in `main.js` to get more diagnostics.

### Suggested small tasks for newcomers (low friction)
 - Verify `js/hls.js` is present and update to a current release if needed.
- Add a small validation check in `main.js` for `baseURL` ending with `/` and `jsonURL` presence.
- Add a README note about how to run the ffmpeg script on Windows (e.g., WSL/Git Bash) and a sample server command.

### When editing `main.js`:
- Keep DOM manipulation minimal and preserve history pushState behavior.
- Prefer small, safe changes: add event/error listeners to HLS.js rather than replacing the playback model.
- Update `commonAudioFormats` if you add new audio file types; maintain the filter placed in `fetchShareJson()`.

If anything in this summary is unclear or you'd like more detail (for example, a code walkthrough of `main.js` with inline comments), say so and I'll expand the relevant section.
