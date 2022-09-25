import EventEmitter from "eventemitter3";
import { IVector3, Vector3 } from "$root/Vector3";

/** [0.0-1.0 of trailLength] Minimal number of history records before tracking collisions */
const minLength = 0.05;
/** Height of the trail above wheel center */
const extendUp = 0.32;
/** Height of the trail bellow the wheel center */
const extendDown = 0.3;
/** Width of the trail */
const trailWidth = 0.1;
/** [0.0-1.0] Portion at the end of the trail that fades out */
const fadeOutOffset = 0.1;
/** Minimal moved distance before we start removing the trail */
const minDistace = 0.1;
/**
 * [0.0-1.0] Portion of the trail that doesn't collide with the bike.
 * The smaller the faster bike has go.
 */
const ownTrailThreshold = 0.1;
/** How often record positions. */
const segmentInterval = 1000 / 45;

export interface TrailOptions {
  /** Number of segments that is stored in history. Affects maximal length of the trail */
  trailLength: number;
  /** Color of the trail */
  color: IVector3;
}

export class TronTrail extends EventEmitter {
  private tick = 0;
  private options: TrailOptions = {
    trailLength: 256,
    color: [255, 255, 255],
  };

  private boneI: number;
  private lastTimestamp = GetGameTimer();
  private posHistory: [Vector3, Vector3][] = [];
  private hitboxMin: IVector3;
  private hitboxMax: IVector3;

  constructor(readonly vehicle: number, options?: Partial<TrailOptions>) {
    super();
    Object.assign(this.options, options);

    this.boneI = GetEntityBoneIndexByName(this.vehicle, "wheel_lr");
    const model = GetEntityModel(vehicle);
    const [hitboxMin, hitboxMax] = GetModelDimensions(model) as [IVector3, IVector3];
    this.hitboxMin = hitboxMin;
    this.hitboxMax = hitboxMax;
  }

  start() {
    if (this.tick) throw new Error("Trail is already running");
    this.tick = setTick(this.onTick.bind(this));
  }

  stop() {
    if (this.tick) clearTick(this.tick);
    this.tick = 0;
  }

  private onTick() {
    if (!HasStreamedTextureDictLoaded("Deadline")) return RequestStreamedTextureDict("Deadline", true);

    const { options } = this;

    if (!this.vehicle || !DoesEntityExist(this.vehicle) || !IsVehicleDriveable(this.vehicle, false)) {
      return this.stop();
    }

    const pos = new Vector3(GetWorldPositionOfEntityBone(this.vehicle, this.boneI));
    const [_fv, _rv, upVectorRaw, vehPos] = GetEntityMatrix(this.vehicle);
    const upVector = new Vector3(upVectorRaw);

    const bottom = pos.sub(upVector.mult(extendDown));
    const top = pos.add(upVector.mult(extendUp));
    const newSegment: [Vector3, Vector3] = [top, bottom];

    const timestamp = GetGameTimer();
    if (timestamp - this.lastTimestamp >= segmentInterval) {
      this.lastTimestamp = timestamp;

      this.posHistory.push(newSegment);

      if (this.posHistory.length > 2) {
        // Progresively remove segments while slow/stopped
        const last = this.posHistory[this.posHistory.length - 2];
        if (last[1].sub(bottom).getLength() < minDistace) this.posHistory.shift();
      }
    }

    // No rendering needed yet
    if (this.posHistory.length < 2) return;

    // Process
    const _ownTrailThreshold = this.posHistory.length * (1 - ownTrailThreshold);
    const segments = [...this.posHistory, newSegment];

    let lastPoints: [Vector3, Vector3] | undefined = undefined;
    for (let i = this.posHistory.length; i > 0; i--) {
      if (this.posHistory.length - i > options.trailLength) {
        this.posHistory.shift();
        continue;
      }

      const [top0, bottom0] = segments[i - 1];
      const [top1, bottom1] = segments[i];

      if (this.posHistory.length > minLength * options.trailLength && i < _ownTrailThreshold) {
        if (!lastPoints) {
          lastPoints = [
            GetOffsetFromEntityGivenWorldCoords(this.vehicle, ...bottom0.asTuple()),
            GetOffsetFromEntityGivenWorldCoords(this.vehicle, ...top0.asTuple()),
          ].map((v) => new Vector3(v)) as [Vector3, Vector3];
        }

        const points = [
          GetOffsetFromEntityGivenWorldCoords(this.vehicle, ...bottom1.asTuple()),
          GetOffsetFromEntityGivenWorldCoords(this.vehicle, ...top1.asTuple()),
        ].map((v) => new Vector3(v)) as [Vector3, Vector3];

        // Check collision
        // if (points.some((point) => point.every((v, i) => (v < 0 ? v > this.hitboxMin[i] : v < this.hitboxMax[i])))) {
        // Deffers the check one more segment away
        const line0 = points[0].sub(lastPoints[0]);
        const length0 = line0.getLength();
        const line1 = points[1].sub(lastPoints[1]);
        const length1 = line1.getLength();

        // Normalisation is done by .div instead of .normalise to do .getLength once instead of twice
        if (
          doesLineCollideWithBox(lastPoints[0], line0.div(length0).inv(), length0, this.hitboxMin, this.hitboxMax) ||
          doesLineCollideWithBox(lastPoints[1], line1.div(length1).inv(), length1, this.hitboxMin, this.hitboxMax)
        ) {
          AddExplosion(vehPos[0], vehPos[1], vehPos[2], 10, 1, true, false, 1);

          this.stop();
          break;
        }
        lastPoints = points;
      }

      const alpha = Math.floor((i / (this.posHistory.length * fadeOutOffset)) * 255);

      // FIXME: triangles are distinguishable from one of the sides when tiled towards that side
      drawPoly(top0, bottom1, bottom0, options.color, alpha, 0);
      drawPoly(bottom0, bottom1, top0, options.color, alpha, 1);
      drawPoly(top0, top1, bottom1, options.color, alpha, 2);
      drawPoly(top1, top0, bottom1, options.color, alpha, 3);
    }
  }
}

/**
 *
 * @param p Initial point of the line
 * @param dirInv Inverse of directional vector of the line
 * @param length Length of the segment
 * @param bMin Bounding box minimum
 * @param bMax Bounding box maximum
 * @see https://gamedev.stackexchange.com/questions/18436/most-efficient-aabb-vs-ray-collision-algorithms/18459#18459
 */
function doesLineCollideWithBox(p: IVector3, dirInv: IVector3, length: number, bMin: IVector3, bMax: IVector3) {
  // lb is the corner of AABB with minimal coordinates - left bottom, rt is maximal corner
  // r.org is origin of ray
  const t1 = (bMin[0] - p[0]) * dirInv[0];
  const t2 = (bMax[0] - p[0]) * dirInv[0];
  const t3 = (bMin[1] - p[1]) * dirInv[1];
  const t4 = (bMax[1] - p[1]) * dirInv[1];
  const t5 = (bMin[2] - p[2]) * dirInv[2];
  const t6 = (bMax[2] - p[2]) * dirInv[2];

  const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
  const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
  let t: number;

  // if tmax < 0, ray (line) is intersecting AABB, but the whole AABB is behind us
  if (tmax < 0) {
    t = tmax;
    return false;
  }

  // if tmin > tmax, ray doesn't intersect AABB
  if (tmin > tmax) {
    t = tmax;
    return false;
  }

  t = tmin;
  return t <= length;
}

const DRAW_POLY_SIDES = [
  [0, 1, 0, 0, 0, 0, 1, 0, 1],
  [0, 0, 1, 1, 0, 1, 1, 1, 1],
  [0, 0, 1, 1, 0, 1, 1, 1, 1],
  [0, 0, 1, 1, 0, 1, 1, 1, 1],
] as const;
function drawPoly(pos0: IVector3, pos1: IVector3, pos2: IVector3, color: IVector3, alpha: number, side: number) {
  DrawSpritePoly(
    ...pos0,
    ...pos1,
    ...pos2,
    ...color,
    alpha,
    "Deadline",
    "Deadline_Trail_01",
    ...DRAW_POLY_SIDES[side as 0],
  );
}
