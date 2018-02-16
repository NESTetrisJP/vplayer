/** @jsx h */

import { h, app } from "hyperapp"

const startStack = -6 // Because players scarcely erase lines in the very beginning

// stack speeds are lines/sec
const stackSpeed18Slow = 0.3916
const stackSpeed18Fast = 0.4305
const stackSpeed19 = 0.4700
const stackSpeed29 = 0.9000

const stackProbSteep = 1.5  // Relevant to time-variance of lines
const basePoint = [40, 100, 300, 1200]

let profile = {
  name: "Default player",
  params: {
    // Usually 0 (slow) or 1 (fast); affects stacking speed in level 18
    use_drop: 0,
    lines_18_safe: [0.4, 0.1, 0.1, 0.4],
    lines_19_safe: [0.4, 0.2, 0.15, 0.25],
    lines_18_danger: [0.6, 0.2, 0.1, 0.1],
    lines_19_danger: [0.7, 0.15, 0.1, 0.05],
    lines_29: [0.7, 0.15, 0.1, 0.05],
    safe_to_danger: [0.02, 0.05, 0.4],
    danger_to_safe: [0.05, 0.02, 0],
    danger_to_death: [0.002, 0.008, 1]
  }
}

let player = null
let intervalId = null

class Player {
  constructor(params) {
    this.useDrop           = params["use_drop"]
    this.linesProb18Safe   = params["lines_18_safe"]
    this.linesProb18Danger = params["lines_18_danger"]
    this.linesProb19Safe   = params["lines_19_safe"]
    this.linesProb19Danger = params["lines_18_danger"]
    this.linesProb29       = params["lines_29"]
    this.dangerProb18      = params["safe_to_danger"][0]
    this.dangerProb19      = params["safe_to_danger"][1]
    this.dangerProb29      = params["safe_to_danger"][2]
    this.recoveryProb18    = params["danger_to_safe"][0]
    this.recoveryProb19    = params["danger_to_safe"][1]
    this.recoveryProb29    = params["danger_to_safe"][2]
    this.deathProb18       = params["danger_to_death"][0]
    this.deathProb19       = params["danger_to_death"][1]
    this.deathProb29       = params["danger_to_death"][2]

    this.time = 0
    this.stack = startStack
    this.score = 0
    this.lines = 0
    this.level = 18
    this.currentStackSpeed = stackSpeed18Slow + this.useDrop * (stackSpeed18Fast - stackSpeed18Slow)
    this.currentLinesProb = this.linesProb18Safe
    this.currentDangerProb = this.dangerProb18
    this.currentRecoveryProb = this.recoveryProb18
    this.currentDeathProb = this.deathProb18
    this.currentLinesExpect = 1 * this.currentLinesProb[0] +
                              2 * this.currentLinesProb[1] +
                              3 * this.currentLinesProb[2] +
                              4 * this.currentLinesProb[3]
    this.danger = false
    this.dead = false

    this.logScore = [0]
    this.logLines = [0]
  }

  step() {
    if (this.dead) return
    this.time++
    if (this.danger) {
      if (Math.random() < this.currentRecoveryProb) this.danger = false
      if (Math.random() < this.currentDeathProb) {
        this.dead = true
        return
      }
    } else {
      if (Math.random() < this.currentDangerProb) this.danger = true
    }

    if (this.level == 18) {
      this.currentStackSpeed = stackSpeed18Slow + this.useDrop * (stackSpeed18Fast - stackSpeed18Slow)
      this.currentLinesProb = this.danger ? this.linesProb18Danger : this.linesProb18Safe
      this.currentDangerProb = this.dangerProb18
      this.currentRecoveryProb = this.recoveryProb18
      this.currentDeathProb = this.deathProb18
    } else if (19 <= this.level && this.level <= 28) {
      this.currentStackSpeed = stackSpeed19
      this.currentLinesProb = this.danger ? this.linesProb19Danger : this.linesProb19Safe
      this.currentDangerProb = this.dangerProb19
      this.currentRecoveryProb = this.recoveryProb19
      this.currentDeathProb = this.deathProb19
    } else if (29 <= this.level) {
      this.currentStackSpeed = stackSpeed29
      this.currentLinesProb = this.linesProb29
      this.currentDangerProb = this.dangerProb29
      this.currentRecoveryProb = this.recoveryProb29
      this.currentDeathProb = this.deathProb29
    }
    this.currentLinesExpect = 1 * this.currentLinesProb[0] +
                              2 * this.currentLinesProb[1] +
                              3 * this.currentLinesProb[2] +
                              4 * this.currentLinesProb[3]

    this.stack += this.currentStackSpeed
    // When lines are erased, expectation of stack decrease is `linesExpect`.
    // Expectation of stack increase is `currentStackSpeed`
    // so whole expectation of stack decrease should be identical.
    // * 2 comes from expectation of logistic
    if (Math.random() < this.currentStackSpeed / this.currentLinesExpect * 2) {
      // `currentStackSpeed / linesExpect * 2` always (hopefully) less than 1
      // if it should be greater than 1, trial below needs to be performed more than once
      let eraseProb = 1 / (1 + Math.exp(-stackProbSteep * this.stack))  // logistic
      if (Math.random() < eraseProb) {
        let roulette = Math.random()
        let erasedLines
        for (let i = 0; i < 4; i++) {
          if (roulette < this.currentLinesProb[i]) {
            erasedLines = i + 1
            break
          }
          roulette -= this.currentLinesProb[i]
        }
        this.lines += erasedLines
        this.stack -= erasedLines

        if (this.lines >= 130) this.level = 19 + Math.floor((this.lines - 130) / 10)
        this.score += basePoint[erasedLines - 1] * (this.level + 1)
      }
    }
    //if (this.time % 30 == 0) {
      this.logScore.push(this.score)
      this.logLines.push(this.lines)
    //}
  }
}

const getParams = window.location.search.substring(1).split("&").reduce((result, query) => {
  const [k, v] = query.split("=")
  result[k] = decodeURI(v)
  return result
}, {})

const debug = getParams["debug"] == "true"
const profileUrl = getParams["profile"]

if (profileUrl) {
  var xhr = new XMLHttpRequest()
  xhr.open("GET", profileUrl, true)
  xhr.responseType = "json"
  xhr.onload = () => {
    if (xhr.readyState == 4) {
      if (xhr.status == 200) {
        console.log("Profile successfully loaded:")
        console.log(xhr.response)
        main.loadProfile(xhr.response)
      } else {
        console.error("Failed in loading profile:")
        console.error(xhr.statusText)
      }
    }
  }
  xhr.onerror = () => {
    console.error("Failed in loading profile:")
    console.error(xhr.statusText)
  }
  xhr.send(null)
}


const state = {
  name: "Default player",
  lines: 0,
  score: 0,
  working: false,
  playerState: 0
}

const actions = {
  dropProfile: e => (_, actions) => {
    const dt = e.dataTransfer
    if (dt.items && dt.items.length == 1) {
      const file = dt.items[0].getAsFile()
      const reader = new FileReader()
      reader.onload = (e) => {
        const profile = JSON.parse(e.target.result)
        console.log("Profile successfully loaded:")
        console.log(profile)
        actions.loadProfile(profile)
      }
      reader.onerror = (e) => {
        console.error("Failed in loading profile:")
        console.error(e)
      }
      reader.readAsText(file)
    }
  },
  loadProfile: p => state => {
    profile = p
    return {
      name: p.name
    }
  },
  start: () => (state, actions) => {
    if (!player) {
      player = new Player(profile.params)
      intervalId = setInterval(() => actions.step(), 1000)
      return {
        working: true
      }
    }
  },
  step: () => state => {
    player.step()
    return {
      score: player.score,
      lines: player.lines,
      working: !player.dead,
      playerState: player.dead ? 2 : player.danger ? 1 : 0
    }
  },
  skip: () => state => {
    if (player) {
      while (!player.dead) player.step()
      return {
        score: player.score,
        lines: player.lines,
        working: false,
        playerState: 2
      }
    }
  },
  reset: () => state => {
    if (player) {
      player = null
      clearInterval(intervalId)
      return {
        score: 0,
        lines: 0,
        working: false,
        playerState: 0
      }
    }
  }
}

const view = (state, actions) => (
  <div id="container" className={state.working ? "working" : ""}>
    <div id="name">{state.name}</div>
    <div id="status" className={state.playerState == 1 ? "danger" : state.playerState == 2 ? "dead" : ""}>
      <div id="lines">{state.lines} Lines</div>
      <div id="score">{state.score}</div>
    </div>
  </div>
)

const main = app(state, actions, view, document.body)

document.addEventListener("dragover", e => e.preventDefault())
document.addEventListener("drop", e => {
  e.preventDefault()
  main.dropProfile(e)
})

if (debug) {
  document.addEventListener("keypress", (e) => {
    switch (e.key) {
      case "Enter":
        let log = ""
        for (let k = 1; k <= 10; k++) {
          const player = new Player(profile.params)
          while (!player.dead) player.step()
          log += `st${k} <- c(${player.logScore.join(", ")})\n` +
                 `lt${k} <- c(${player.logLines.join(", ")})\n`
        }
        console.log(log)
      break
    }
  })
} else {
  document.addEventListener("keypress", (e) => {
    switch (e.key) {
      case "Enter":
        main.start()
        break
      case "s":
        main.skip()
        break
      case "r":
        main.reset()
        break
    }
  })
}
