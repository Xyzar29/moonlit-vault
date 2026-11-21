// Moonlit Vault — the night watchmen.
// Each guard walks a patrol of waypoints, pauses to look around, and reacts in
// stages: a glimpse or a footstep makes him suspicious, suspicion sends him to
// investigate the last place he sensed something, and a clear, sustained view
// of the thief raises the alarm. Break his line of sight and he searches,
// gives up, and returns to his patrol — the recovery a fair stealth game owes.

import { angleDifference, distance, visionStrength } from './vision.js';
import { moveCircle } from './physics.js';

export const STATE = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  INVESTIGATE: 'investigate',
  SEARCH: 'search',
  ALERT: 'alert',
};

const FILL_RATE = 0.85; // awareness per second at full vision strength
const DECAY_RATE = 0.16; // awareness lost per second while the thief is unseen
const SUSPICION_AT = 0.4;
const ALARM_AT = 1.0;
const CAUGHT_GRACE = 0.85; // seconds of unbroken sight at full alarm = caught

export class Guard {
  constructor(def) {
    this.waypoints = def.waypoints;
    this.pauseTime = def.pause;
    this.patrolSpeed = def.speed;
    this.x = def.waypoints[0][0];
    this.y = def.waypoints[0][1];
    const [tx, ty] = def.waypoints[1] || def.waypoints[0];
    this.angle = Math.atan2(ty - this.y, tx - this.x);
    this.targetIndex = def.waypoints.length > 1 ? 1 : 0;
    this.state = STATE.PATROL;
    this.awareness = 0;
    this.pauseLeft = 0;
    this.lookPhase = Math.random() * Math.PI * 2;
    this.lastSeen = null; // {x, y} of the latest glimpse or footstep
    this.searchLeft = 0;
    this.sightHeld = 0; // seconds of unbroken sight while at full alarm
    this.stepPhase = 0;
  }

  get alarmed() {
    return this.state === STATE.ALERT;
  }

  // A footstep heard nearby: turn toward it and grow suspicious.
  hearNoise(x, y, level) {
    if (this.state === STATE.ALERT) return;
    this.lastSeen = { x, y };
    this.awareness = Math.max(this.awareness, SUSPICION_AT + 0.08);
    this.state = STATE.SUSPICIOUS;
    this.pauseLeft = Math.max(this.pauseLeft, 0.55);
  }

  update(dt, player, level, events) {
    const seen = visionStrength(this, player, level);
    if (seen > 0) {
      this.awareness = Math.min(ALARM_AT, this.awareness + seen * FILL_RATE * dt);
      this.lastSeen = { x: player.x, y: player.y };
      if (this.awareness >= ALARM_AT) {
        if (this.state !== STATE.ALERT) events.push('alarm');
        this.state = STATE.ALERT;
        this.sightHeld += dt;
        if (this.sightHeld >= CAUGHT_GRACE) events.push('caught');
      } else if (this.awareness >= SUSPICION_AT) {
        if (this.state === STATE.PATROL) events.push('suspicion');
        this.state = STATE.SUSPICIOUS;
      }
    } else {
      this.sightHeld = 0;
      if (this.state !== STATE.INVESTIGATE && this.state !== STATE.SEARCH) {
        this.awareness = Math.max(0, this.awareness - DECAY_RATE * dt);
      }
      if (this.state === STATE.ALERT) {
        // The thief broke away: charge to the last seen spot and search it.
        this.state = STATE.INVESTIGATE;
      } else if (this.state === STATE.SUSPICIOUS && this.awareness <= 0.05) {
        this.state = STATE.PATROL;
      }
    }

    switch (this.state) {
      case STATE.PATROL:
        this.updatePatrol(dt, level);
        break;
      case STATE.SUSPICIOUS:
        this.faceToward(this.lastSeen, dt, 3.4);
        this.pauseLeft -= dt;
        if (this.pauseLeft <= 0 && this.awareness >= SUSPICION_AT) {
          this.state = STATE.INVESTIGATE;
        }
        break;
      case STATE.INVESTIGATE: {
        const done = this.walkTo(this.lastSeen.x, this.lastSeen.y, dt, level, this.patrolSpeed * 1.55);
        if (done) {
          this.state = STATE.SEARCH;
          this.searchLeft = 2.6;
          this.awareness = Math.max(this.awareness, 0.55);
        }
        break;
      }
      case STATE.SEARCH:
        this.searchLeft -= dt;
        this.angle += Math.sin(this.searchLeft * 2.4) * 1.9 * dt;
        this.awareness = Math.max(0, this.awareness - DECAY_RATE * 0.7 * dt);
        if (this.searchLeft <= 0) {
          this.state = STATE.PATROL;
          this.awareness = Math.min(this.awareness, 0.25);
          this.retargetNearestWaypoint();
        }
        break;
      case STATE.ALERT:
        // Chase while sight holds; the catch itself fires from sightHeld.
        if (distance(this.x, this.y, player.x, player.y) > 26) {
          this.walkTo(player.x, player.y, dt, level, this.patrolSpeed * 1.9);
        } else {
          this.faceToward(player, dt, 6);
        }
        break;
    }
    this.stepPhase += dt * (this.state === STATE.PATROL ? 6 : 9);
  }

  updatePatrol(dt, level) {
    if (this.pauseLeft > 0) {
      this.pauseLeft -= dt;
      this.lookPhase += dt;
      // Paused guards sweep their lantern slowly from side to side.
      this.angle += Math.sin(this.lookPhase * 1.7) * 0.55 * dt;
      return;
    }
    const [tx, ty] = this.waypoints[this.targetIndex];
    if (this.walkTo(tx, ty, dt, level, this.patrolSpeed)) {
      this.targetIndex = (this.targetIndex + 1) % this.waypoints.length;
      this.pauseLeft = this.pauseTime;
      this.lookPhase = 0;
    }
  }

  // Walk toward a point, turning smoothly. Returns true on arrival.
  walkTo(x, y, dt, level, speed) {
    const d = distance(this.x, this.y, x, y);
    if (d < 6) return true;
    const want = Math.atan2(y - this.y, x - this.x);
    this.faceToward({ x, y }, dt, 4.2);
    const step = Math.min(d, speed * dt);
    moveCircle(this, Math.cos(want) * step, Math.sin(want) * step, level);
    return distance(this.x, this.y, x, y) < 8;
  }

  faceToward(point, dt, turnRate) {
    if (!point) return;
    const want = Math.atan2(point.y - this.y, point.x - this.x);
    const diff = angleDifference(want, this.angle);
    const maxTurn = turnRate * dt;
    this.angle += Math.max(-maxTurn, Math.min(maxTurn, diff));
  }

  retargetNearestWaypoint() {
    let best = 0;
    let bestDist = Infinity;
    this.waypoints.forEach(([x, y], i) => {
      const d = distance(this.x, this.y, x, y);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    this.targetIndex = best;
  }
}
