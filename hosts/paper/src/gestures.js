/**
 * MediaPipe Hands (@mediapipe/tasks-vision).
 * v3.9:
 *  a1 snow: open hand “5”
 *  a2 gift: two-hand heart
 *  a3 bell: pinch + shake
 *  a7 hat: one finger (1)
 *  a6 antlers: two fingers (2)
 *  b8 tree lights: three fingers (3)
 *  next (coach): OK 👌
 */

const COOLDOWN = {
  a1: 90, // near-zero: snow can re-trigger freely while holding “5”
  a2: 1800,
  a3: 380,
  a6: 1400,
  a7: 1400,
  b8: 1600,
  next: 900,
}

function dist(a, b) {
  if (!a || !b) return 1
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function fingerExtended(hand, tip, pip) {
  const wrist = hand[0]
  return dist(hand[tip], wrist) > dist(hand[pip], wrist) * 1.06
}

function fingerFolded(hand, tip, pip) {
  const wrist = hand[0]
  return dist(hand[tip], wrist) < dist(hand[pip], wrist) * 1.12
}

/**
 * 0 = fully open, 1 = tightly curled.
 * Orientation-agnostic — distance only, no Y bias.
 */
export function fingerCurlScore(hand) {
  if (!hand || hand.length < 21) return 0.5
  const pairs = [
    [8, 6, 5],
    [12, 10, 9],
    [16, 14, 13],
    [20, 18, 17],
  ]
  let sum = 0
  for (const [tip, pip, mcp] of pairs) {
    const tipMcp = dist(hand[tip], hand[mcp])
    const pipMcp = Math.max(0.001, dist(hand[pip], hand[mcp]))
    const ratio = tipMcp / pipMcp
    if (ratio < 1.25) sum += 1
    else if (ratio > 1.85) sum += 0
    else sum += 0.4
  }
  const cluster =
    (dist(hand[8], hand[5]) + dist(hand[12], hand[9]) + dist(hand[16], hand[13])) / 3
  const clusterBonus = cluster < 0.09 ? 0.12 : cluster > 0.16 ? -0.08 : 0
  return Math.max(0, Math.min(1, sum / 4 + clusterBonus))
}

export function isFist(hand) {
  if (!hand || hand.length < 21) return false
  if (fingerCurlScore(hand) < 0.52) return false
  const wrist = hand[0]
  const tipsClose = [8, 12, 16].filter((t) => dist(hand[t], wrist) < 0.34).length >= 2
  return tipsClose
}

/** Open palm / anchors. Orientation-agnostic (works with hand raised). */
export function openPalm(hand) {
  if (!hand || hand.length < 21) return false
  if (fingerCurlScore(hand) > 0.45) return false
  let n = 0
  for (const [tip, pip, mcp] of [
    [8, 6, 5],
    [12, 10, 9],
    [16, 14, 13],
    [20, 18, 17],
  ]) {
    if (dist(hand[tip], hand[mcp]) > dist(hand[pip], hand[mcp]) * 1.25) n++
  }
  const spread = dist(hand[8], hand[20])
  return n >= 3 && spread > 0.05
}

/**
 * Number “5” — all five digits open & spread.
 * Distance-based only (no “tip above knuckle” Y tests) so raised hands still work.
 */
export function isFive(hand) {
  if (!hand || hand.length < 21) return false
  if (isOK(hand) || isPinching(hand) || isOneFinger(hand) || isTwoFingers(hand)) return false
  if (fingerCurlScore(hand) > 0.4) return false

  let ext = 0
  for (const [tip, pip, mcp] of [
    [8, 6, 5],
    [12, 10, 9],
    [16, 14, 13],
    [20, 18, 17],
  ]) {
    if (dist(hand[tip], hand[mcp]) > dist(hand[pip], hand[mcp]) * 1.22) ext++
  }
  const thumbOut =
    dist(hand[4], hand[0]) > dist(hand[2], hand[0]) * 1.05 &&
    dist(hand[4], hand[8]) > 0.045
  const spread = dist(hand[8], hand[20])
  const midSpread = dist(hand[8], hand[12]) > 0.025 && dist(hand[12], hand[16]) > 0.02
  return ext >= 4 && thumbOut && spread > 0.055 && midSpread
}

export function isOK(hand) {
  if (!hand || hand.length < 21) return false
  if (dist(hand[4], hand[8]) >= 0.055) return false
  let ext = 0
  for (const [tip, pip] of [
    [12, 10],
    [16, 14],
    [20, 18],
  ]) {
    if (fingerExtended(hand, tip, pip)) ext++
  }
  return ext >= 2
}

/** Number “1” — index extended, other three folded (orientation-agnostic). */
export function isOneFinger(hand) {
  if (!hand || hand.length < 21) return false
  if (isOK(hand) || isPinching(hand)) return false
  const idx = fingerExtended(hand, 8, 6) && dist(hand[8], hand[5]) > dist(hand[6], hand[5]) * 1.2
  const midFold = !fingerExtended(hand, 12, 10) || fingerFolded(hand, 12, 10)
  const ringFold = !fingerExtended(hand, 16, 14) || fingerFolded(hand, 16, 14)
  const pinkyFold = !fingerExtended(hand, 20, 18) || fingerFolded(hand, 20, 18)
  const midNotExt = dist(hand[12], hand[9]) < dist(hand[8], hand[5]) * 0.85
  return idx && midFold && ringFold && pinkyFold && midNotExt
}

/** Number “2” — index + middle extended, ring & pinky folded (orientation-agnostic). */
export function isTwoFingers(hand) {
  if (!hand || hand.length < 21) return false
  if (isOK(hand)) return false
  const idx = fingerExtended(hand, 8, 6) && dist(hand[8], hand[5]) > dist(hand[6], hand[5]) * 1.15
  const midF = fingerExtended(hand, 12, 10) && dist(hand[12], hand[9]) > dist(hand[10], hand[9]) * 1.15
  const ringFold = !fingerExtended(hand, 16, 14) || fingerFolded(hand, 16, 14)
  const pinkyFold = !fingerExtended(hand, 20, 18) || fingerFolded(hand, 20, 18)
  const spread = dist(hand[8], hand[12]) > 0.025
  return idx && midF && ringFold && pinkyFold && spread
}

/** Number “3” — index + middle + ring extended, pinky folded (tree lights). */
export function isThreeFingers(hand) {
  if (!hand || hand.length < 21) return false
  if (isOK(hand) || isFive(hand) || isOneFinger(hand) || isTwoFingers(hand)) return false
  const idx = fingerExtended(hand, 8, 6) && dist(hand[8], hand[5]) > dist(hand[6], hand[5]) * 1.12
  const midF = fingerExtended(hand, 12, 10) && dist(hand[12], hand[9]) > dist(hand[10], hand[9]) * 1.12
  const ring = fingerExtended(hand, 16, 14) && dist(hand[16], hand[13]) > dist(hand[14], hand[13]) * 1.1
  const pinkyFold = !fingerExtended(hand, 20, 18) || fingerFolded(hand, 20, 18)
  const spread = dist(hand[8], hand[16]) > 0.04
  return idx && midF && ring && pinkyFold && spread
}

/** @deprecated alias */
export function isPeace(hand) {
  return isTwoFingers(hand)
}

function isPinching(hand) {
  if (!hand || hand.length < 21) return false
  // Thumb + index tips together; other fingers must NOT stick out
  if (dist(hand[4], hand[8]) >= 0.048) return false
  const othersExt = [12, 16, 20].filter((tip, i) =>
    fingerExtended(hand, tip, [10, 14, 18][i]),
  ).length
  return othersExt === 0
}

function pinchPoint(hand) {
  return mid(hand[4], hand[8])
}

export function getLiveAnchors(hands, pose) {
  const hs = (hands || []).filter((h) => h && h.length >= 21)
  const out = {
    palmsMid: null,
    pinch: null,
    heart: null,
    face: null,
    palm: null,
    fist: null,
  }
  if (pose && pose.length > 10) {
    const nose = pose[0]
    const earL = pose[7]
    const earR = pose[8]
    const eyeL = pose[2]
    const eyeR = pose[5]
    if (nose) {
      const earSpan = earL && earR ? Math.abs(earL.x - earR.x) : 0.12
      const eyeY =
        eyeL && eyeR ? (eyeL.y + eyeR.y) / 2 : nose.y - earSpan * 0.15
      const midX = earL && earR ? (earL.x + earR.x) / 2 : nose.x
      const crownY = Math.min(eyeY, nose.y) - earSpan * 1.05
      out.face = {
        x: midX,
        y: nose.y,
        crownX: midX,
        crownY,
        earSpan: Math.max(0.08, earSpan),
      }
    }
  }

  if (!hs.length) return out

  const open = hs.find(openPalm)
  if (open) out.palm = { x: open[9].x, y: open[9].y }

  const fist = hs.find(isFist)
  if (fist) out.fist = { x: fist[9].x, y: fist[9].y }

  if (hs.length >= 2) {
    out.palmsMid = mid(hs[0][9], hs[1][9])
    const heart = detectHeart(hs[0], hs[1])
    if (heart) out.heart = heart
  }

  for (const h of hs) {
    if (isPinching(h)) out.pinch = pinchPoint(h)
  }

  return out
}

export class GestureDetector {
  constructor() {
    this.last = {}
    this.dwell = {}
    this.bell = { pinched: false, crossings: 0, lastX: 0, since: 0, _prevDx: 0 }
    this.strict = false
    this.wantNext = false
  }

  setStrict(on) {
    this.strict = Boolean(on)
  }

  setWantNext(on) {
    this.wantNext = Boolean(on)
    if (!on) this.dwell.next = 0
  }

  _cooled(id, now) {
    return !this.last[id] || now - this.last[id] > COOLDOWN[id]
  }

  _mark(id, now) {
    this.last[id] = now
    this.dwell[id] = 0
  }

  _dwellOk(id, now, active, ms = 400) {
    const need = ms * (this.strict ? 1.15 : 1)
    if (!active) {
      this.dwell[id] = 0
      return false
    }
    if (!this.dwell[id]) this.dwell[id] = now
    return now - this.dwell[id] >= need
  }

  update(pose, hands, now = performance.now()) {
    const events = []
    const hs = (hands || []).filter((h) => h && h.length >= 21)
    const anchors = getLiveAnchors(hs, pose)
    const face = anchors.face

    // Coach next: OK 👌
    if (this.wantNext && this._cooled('next', now)) {
      const ok = hs.some(isOK)
      if (this._dwellOk('next', now, ok, 360)) {
        events.push({ id: 'next', payload: {} })
        this._mark('next', now)
      }
    } else if (!this.wantNext) {
      this.dwell.next = 0
    }

    // A1 snow: open hand “5” — left and/or right at once
    if (this._cooled('a1', now)) {
      const fives = hs.filter(isFive)
      if (fives.length) {
        events.push({
          id: 'a1',
          payload: {
            palms: fives.map((h) => ({ x: h[9].x, y: h[9].y })),
            palm: { x: fives[0][9].x, y: fives[0][9].y },
          },
        })
        this._mark('a1', now)
      }
    }

    // A2 gift: heart
    if (hs.length >= 2 && this._cooled('a2', now)) {
      const heart = detectHeart(hs[0], hs[1])
      if (this._dwellOk('a2', now, Boolean(heart), 380)) {
        events.push({ id: 'a2', payload: { at: heart } })
        this._mark('a2', now)
      }
    } else {
      this.dwell.a2 = 0
    }

    // A3 bell: pinch + deliberate shake flip (less sensitive; one note per flip)
    {
      let pinchedHand = null
      for (const h of hs) {
        if (isPinching(h)) {
          pinchedHand = h
          break
        }
      }
      if (pinchedHand) {
        const p = pinchPoint(pinchedHand)
        if (!this.bell.pinched) {
          this.bell.pinched = true
          this.bell.since = now
          this.bell.crossings = 0
          this.bell.lastX = p.x
          this.bell._prevDx = 0
          // Do not ring on pinch alone — wait for a real shake
        } else {
          const dx = p.x - this.bell.lastX
          if (Math.abs(dx) > 0.028) {
            const prev = this.bell._prevDx || 0
            const flipped = prev && Math.sign(dx) !== Math.sign(prev)
            this.bell._prevDx = dx
            this.bell.lastX = p.x
            if (flipped && this._cooled('a3', now)) {
              this.bell.crossings++
              const dir = Math.sign(dx) || 1
              const strength = Math.min(1, 0.45 + this.bell.crossings * 0.08)
              const impulse =
                dir * (10 + strength * 16) * Math.min(2.2, Math.abs(dx) / 0.03)
              events.push({
                id: 'a3',
                payload: { at: p, strength, dir, impulse },
              })
              this._mark('a3', now)
            }
          }
        }
      } else {
        this.bell.pinched = false
        this.bell.crossings = 0
        this.bell._prevDx = 0
      }
    }

    // A7 hat: one finger (1)
    if (this._cooled('a7', now)) {
      const one = hs.some(isOneFinger)
      if (this._dwellOk('a7', now, one, 380)) {
        events.push({ id: 'a7', payload: {} })
        this._mark('a7', now)
      }
    } else {
      this.dwell.a7 = 0
    }

    // A6 antlers: two fingers (2)
    if (this._cooled('a6', now)) {
      const two = hs.some(isTwoFingers)
      if (this._dwellOk('a6', now, two, 380)) {
        const hand = hs.find(isTwoFingers)
        events.push({
          id: 'a6',
          payload: hand
            ? { left: { x: hand[8].x, y: hand[8].y }, right: { x: hand[12].x, y: hand[12].y } }
            : {},
        })
        this._mark('a6', now)
      }
    } else {
      this.dwell.a6 = 0
    }

    // B8 tree lights: three fingers (3)
    if (this._cooled('b8', now)) {
      const three = hs.some(isThreeFingers)
      if (this._dwellOk('b8', now, three, 380)) {
        const hand = hs.find(isThreeFingers)
        events.push({
          id: 'b8',
          payload: hand ? { at: { x: hand[12].x, y: hand[12].y } } : {},
        })
        this._mark('b8', now)
      }
    } else {
      this.dwell.b8 = 0
    }

    return { events, anchors }
  }
}

function detectHeart(handA, handB) {
  const a4 = handA[4]
  const a8 = handA[8]
  const b4 = handB[4]
  const b8 = handB[8]
  if (!a4 || !a8 || !b4 || !b8) return null
  const indexClose = dist(a8, b8) < 0.09
  const thumbsClose = dist(a4, b4) < 0.12
  const tipsMeet = dist(a8, b4) < 0.1 || dist(b8, a4) < 0.1
  if (!(indexClose && (thumbsClose || tipsMeet))) return null
  return mid(mid(a4, a8), mid(b4, b8))
}
