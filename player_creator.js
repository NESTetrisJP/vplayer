/**
 * player_creator.js
 * 
 * This creates 5 json files (level 0-4), assuming opponents of CTWC Tournament.
 */

const fs = require("fs")

const lower = {
  lines_18_safe: [0.45, 0.15, 0.1, 0.3],
  lines_19_safe: [0.5, 0.2, 0.15, 0.15],
  lines_18_danger: [0.7, 0.15, 0.1, 0.05],
  lines_19_danger: [0.8, 0.1, 0.1, 0],
  lines_29: [0.8, 0.1, 0.1, 0],
  safe_to_danger: [0.035, 0.15, 0.8],
  danger_to_safe: [0.03, 0.02, 0],
  danger_to_death: [0.005, 0.025, 1]
}

const higher = {
  lines_18_safe: [0.3, 0.15, 0.05, 0.5],
  lines_19_safe: [0.3, 0.3, 0.07, 0.33],
  lines_18_danger: [0.7, 0.175, 0.05, 0.075],
  lines_19_danger: [0.6, 0.3, 0.05, 0.05],
  lines_29: [0.7, 0.15, 0.075, 0.075],
  safe_to_danger: [0.012, 0.05, 0.2],
  danger_to_safe: [0.08, 0.03, 0],
  danger_to_death: [0.0006, 0.007, 1]
}

const fractionParams = ["lines_18_safe", "lines_19_safe", "lines_18_danger", "lines_19_danger", "lines_29"]
const otherParams = ["safe_to_danger", "danger_to_safe", "danger_to_death"]

const blend = (a, b, rand) => {
  return a + (b - a) * rand.next()
}

const blendArray = (a, b, rand) => {
  const result = []
  a.forEach((_, i) => {
    result.push(blend(a[i], b[i], rand))
  })
  return result
}

const blendFraction = (a, b, rand) => {
  let result = blendArray(a, b, rand)
  const sum = result.reduce((a, b) => a + b)
  result = result.map(e => e / sum)
  return result
}

class NormalRandom {
  constructor(mu, sigma) {
    this.mu = mu
    this.sigma = sigma
  }
  next() {
    // Box-Muller
    return Math.sqrt(-2 * Math.log(Math.random())) * Math.sin(2 * Math.PI * Math.random()) * this.sigma + this.mu
  }
}

const createProfile = (name, mu, sigma) => {
  const rand = new NormalRandom(mu, sigma)

  const params = {}

  fractionParams.forEach(param => {
    params[param] = blendFraction(lower[param], higher[param], rand)
  })
  otherParams.forEach(param => {
    params[param] = blendArray(lower[param], higher[param], rand)
  })

  params.use_drop = Math.random() > 0.7 ? 1 : 0

  return {
    _author: `Automatically generated with player_creator.js 0.9.1 (mu=${mu}, sigma=${sigma})`,
    name,
    params
  }
}

const muMu = [0.25, 0.5, 0.75, 0.85, 0.95]
const muSigma = [0.075, 0.07, 0.06, 0.05, 0.05]
for (let i = 0; i < 5; i++) {
  const muRand = new NormalRandom(muMu[i], muSigma[i])
  const sigmaRand = new NormalRandom(0.05, 0.02)

  const result = createProfile("Player Level " + i, muRand.next(), sigmaRand.next())
  fs.writeFileSync(`level_${i}.json`, JSON.stringify(result))
}
console.log("Wrote 5 json files assuming 2018 CTWC tournament")