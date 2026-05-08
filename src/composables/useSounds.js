// Sonidos cacheados (instancia única)
const tickSound = new Audio('/sounds/tick.mp3')
tickSound.volume = 0.4
tickSound.loop = true

const sendSound = new Audio('/sounds/send.mp3')
sendSound.volume = 0.7

const joinSound = new Audio('/sounds/join.mp3')
joinSound.volume = 0.6

const winnerSound = new Audio('/sounds/winner.mp3')
winnerSound.volume = 0.7
let _winnerStopAt = 0
let _onWinnerEnded = null
const WINNER_DURATION_MS = 8000

export const startTick = () => {
  try {
    tickSound.currentTime = 0
    const p = tickSound.play()
    if (p?.catch) p.catch(() => {})
  } catch {}
}

export const stopTick = () => {
  try {
    tickSound.pause()
    tickSound.currentTime = 0
  } catch {}
}

export const playSend = () => {
  try {
    sendSound.currentTime = 0
    const p = sendSound.play()
    if (p?.catch) p.catch(() => {})
  } catch {}
}

export const playJoin = () => {
  try {
    joinSound.currentTime = 0
    const p = joinSound.play()
    if (p?.catch) p.catch(() => {})
  } catch {}
}

export const playWinner = () => {
  try {
    stopWinner()
    _winnerStopAt = Date.now() + WINNER_DURATION_MS

    // Loop manual via ended event (más confiable que loop=true en WebView)
    _onWinnerEnded = () => {
      if (Date.now() < _winnerStopAt) {
        winnerSound.currentTime = 0
        const p = winnerSound.play()
        if (p?.catch) p.catch(() => {})
      }
    }
    winnerSound.addEventListener('ended', _onWinnerEnded)

    winnerSound.currentTime = 0
    const p = winnerSound.play()
    if (p?.catch) p.catch(() => {})

    // Stop hard al cumplirse la duración (por si el ended no dispara)
    setTimeout(() => stopWinner(), WINNER_DURATION_MS)
  } catch {}
}

export const stopWinner = () => {
  try {
    _winnerStopAt = 0
    if (_onWinnerEnded) {
      winnerSound.removeEventListener('ended', _onWinnerEnded)
      _onWinnerEnded = null
    }
    winnerSound.pause()
    winnerSound.currentTime = 0
  } catch {}
}
