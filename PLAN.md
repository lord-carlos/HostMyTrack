# HostMyTrack - Plan

## Project Overview
Small static website for playing long music tracks via HLS. Uses hls.js and plyr.js.

## Completed

- [x] Initial working site with hand-downloaded vendor JS

### Bug Fixes (main.js)
- [x] **HLS instance leak**: Call `hls.destroy()` before creating a new Hls instance on track switch
- [x] **Native HLS canplay listener stacking**: Use `audioPlayer.once()` instead of `.on()`
- [x] **`data.reverse()` mutation**: Use `[...data].reverse()` to avoid mutating the fetch response
- [x] **Add `Hls.Events.ERROR` handler**: Network/media error recovery and logging

### Media Session API
- [x] Set `navigator.mediaSession.metadata` when a track starts playing (title, artist)
- [x] Register `play`/`pause` action handlers for lock screen controls
- [x] Register `nexttrack`/`previoustrack` action handlers for lock screen skip buttons
- [x] Update dynamic page title with current track name

### Package Management
- [x] Initialize `package.json` via bun
- [x] Install `hls.js` and `plyr` via `bun add`
- [x] Add `postinstall` copy script to move dist files to `js/vendor/`
- [x] Update `index.html` to reference `js/vendor/` paths
- [x] Remove old hand-downloaded `js/plyr.js`, `js/plyr.css`, `js/hls.js`
- [x] Add `js/vendor/` and `bun.lockb` to `.gitignore`

### Step 1: Extract `loadTrackByIndex(index)` helper
- [x] Created `loadTrackByIndex(index)` — dispatches click + scrolls into view
- [x] Replaced old `loadTrackFromURL()` with `restoreOrLoad()` that uses the helper

### Step 2: Auto-advance to next track
- [x] `audioPlayer.on('ended', ...)` listener
- [x] Clears saved playback state for the completed track
- [x] Advances to `currentIndex + 1` if not the last track (no loop)

### Step 3: Next/Previous via Media Session
- [x] `nexttrack` handler: calls `loadTrackByIndex(currentIndex + 1)` if not last track
- [x] `previoustrack` handler: calls `loadTrackByIndex(currentIndex - 1)` if not first track

### Step 4: Remember playback position
- [x] `savePlaybackState()` — writes `{ track, time }` to localStorage key `"hostmytrack_state"`
- [x] `loadPlaybackState()` / `clearPlaybackState()` — read/remove helpers
- [x] Throttled periodic save via `timeupdate` (every 5 seconds)
- [x] Save on `beforeunload` and on track switch
- [x] Clear on track end (in `ended` handler)
- [x] `pendingSeekTime` flag — seeks once after playback starts, avoids re-seeking on HLS segments
- [x] `restoreOrLoad()` replaces old `loadTrackFromURL()`:
  - If `?track=` URL param → load that track
  - Else if localStorage has saved state → load that track + seek to saved time
  - Else → load track at index 0 (topmost)

## Not Planned

- ~~AudioContext keepalive workaround~~ — too hacky
- ~~Wake Lock API~~ — keeps screen on, counterproductive for background listening
- ~~firstTime guard removal~~ — intentional, browsers block autoplay
- ~~Loop last track back to first~~ — stop at the end instead
