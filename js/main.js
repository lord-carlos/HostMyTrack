const trackIdInput = document.getElementById('track-id');
const trackListContainer = document.getElementById('track-list');
const backButton = document.getElementById('back-button');
let currentIndex = 0;
let trackList = [];
let audio = document.querySelector('#audio-player');
let hls = new Hls();
let firstTime = true;

// Common audio file extensions
const commonAudioFormats = ['.mp3', '.ogg', '.wav', '.aac', '.m4a', '.flac'];

//The URL
let baseURL = '';
let jsonUrl = '';

const audioPlayer = new Plyr(audio, {
    controls: ['play', 'progress', 'current-time', 'duration', 'mute', 'volume']
});
//     urls: {
// download: generateURL(),
// },


// Function to set the URL with the current track ID
function setURL(trackId) {
    history.pushState({ trackId }, '', `?track=${trackId}`);
    trackIdInput.value = trackId;
}

// Function to load the track from the URL
function loadTrackFromURL() {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('track');
    if (trackId) {
        const index = trackList.findIndex((track) => track.name === trackId);
        if (index !== -1) {
            currentIndex = index;

            // Trigger the click event for the corresponding track item
            const trackItem = trackListContainer.children[index];
            if (trackItem) {
                const clickEvent = new Event('click', { bubbles: true });
                trackItem.dispatchEvent(clickEvent);

                // Scroll to the loaded track item
                trackItem.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }
}

// ###############
// HERE WE GO BOIS
// ###############
fetch('config.json')
    .then((response) => response.json())
    .then((config) => {
        // Use the configuration values in your code
        const websiteName = config.websiteName;
        baseURL = config.baseURL;
        jsonUrl = config.jsonURL;

        // Use these values to configure your website
        document.title = websiteName;
        const pageTitle = document.getElementById('page-title');
        pageTitle.textContent = websiteName;
        // Update other parts of your code as needed
        fetchShareJson();
    })
    .catch((error) => console.error('Error loading configuration:', error));


function fetchShareJson() {
    // Load tracks from jsonUrl
    fetch(jsonUrl)
        .then((response) => response.json())
        .then((data) => {
            // Filter out tracks with non-common audio formats
            trackList = data.reverse().filter((track) => {
                const fileExtension = track.name.toLowerCase().match(/\.\w+$/);
                return fileExtension && commonAudioFormats.includes(fileExtension[0]);
            });

            createTrackListUI();
        })
        .then(() => {
            loadTrackFromURL(); // Load track from URL when the page loads
        })
        .catch((error) => console.error(error));
}

function createTrackListUI() {
    trackListContainer.innerHTML = ''; // Clear existing items
    trackList.forEach((track, index) => {
        const trackItem = document.createElement('div');
        trackItem.classList.add('track-item');

        // Format the duration in HH:mm:ss
        const durationInSeconds = track.duration;
        const formattedDuration = formatDuration(durationInSeconds);

        // Format "mtime" to a human-readable date (YYYY-MM-DD)
        const mtime = formatMtime(track.mtime);


        // Replace underscores with spaces and remove file extensions
        const trackNameNoExtension = track.name.replace(/\.(mkv|mp3|ogg|aac)$/i, '')
        const trackName = trackNameNoExtension.replace(/_/g, ' ');

        trackItem.innerHTML = `
            <span class="track-name">${trackName}</span>
            <span class="mtime">${mtime}</span>
            <span class="duration">${formattedDuration}</span>
        `;

        trackItem.addEventListener('click', () => {
            currentIndex = index;
            const hlsPlaylistUrl = baseURL + trackNameNoExtension + "/playlist.m3u8";
            // const hlsPlaylistUrl = baseURL;

            hls.loadSource(hlsPlaylistUrl);

            // };

            // Remove the 'playing' class from all track items
            document.querySelectorAll('.track-item').forEach((item) => {
                item.classList.remove('playing');
            });

            audioPlayer.pause(); // Pause the Plyr player
            hls.stopLoad(); // Stop loading the current source
            hls.detachMedia(); // Detach hls.js from the media element
            // Add the 'playing' class to the currently selected track item
            trackItem.classList.add('playing');

            hls.attachMedia(audio);
            window.hls = hls;
            window.audioPlayer = audioPlayer;
            // Set the URL with the current track ID
            // on first load, don't play the audio
            if (!firstTime) {
                audioPlayer.play();
            } else {
                firstTime = false;
            }            
            // audioPlayer.config.urls = {
            //     download: generateURL(),
            setURL(track.name);
        });
        trackListContainer.appendChild(trackItem);
    });
}

// function generateURL() {
//     const params = new URLSearchParams(window.location.search);
//     const trackId = params.get('track');
//     return 'https://example.com/path/to/download', trackId;
// }

// Add an event listener to the back button
backButton.addEventListener('click', () => {
    // Get the current URL
    const currentURL = window.location.href;

    // Split the URL by '/'
    const parts = currentURL.split('/');

    // Remove the last part (the current page or file)
    parts.pop();

    // Join the parts back together to form the new URL
    const newURL = parts.join('/') + '/'; // Add a trailing slash to represent the directory

    // Navigate to the new URL
    window.location.href = newURL;
});

// Function to format duration in HH:mm:ss
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// Function to format "mtime" to YYYY-MM-DD
function formatMtime(mtime) {
    const date = new Date(mtime);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is 0-based
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}