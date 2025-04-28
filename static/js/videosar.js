// static/js/videosar.js

const START_TIME = 46;
const END_TIME   = 64;
let player;

function createPlayer() {
  player = new YT.Player('yt-player', {
    height: '100%',
    width:  '100%',
    videoId: '0tEzvnaaqoA',
    playerVars: {
      autoplay: 1,
      start:    START_TIME,
      end:      END_TIME,
      controls: 1,
      rel:      0,
      mute:     1
    },
    events: {
      onReady:       e => e.target.playVideo(),
      onStateChange: e => {
        if (e.data === YT.PlayerState.ENDED) {
          player.seekTo(START_TIME);
          player.playVideo();
        }
      }
    }
  });
}

// If the API is already loaded, init immediately; otherwise wait for callback
if (window.YT && YT.Player) {
  createPlayer();
} else {
  window.onYouTubeIframeAPIReady = createPlayer;
}
