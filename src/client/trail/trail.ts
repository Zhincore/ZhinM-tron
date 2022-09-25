import { IVector3, Vector3 } from "$root/Vector3";
import colors from "./colorPresets";

const trailLength = 256;
const minLength = 16;
const brighten = 1.5;
const extendUp = 0.32;
const extendDown = 0.3;
const fadeOutOffset = 0.1;
const minDistace = 0.1;
const ownTrailThreshold = 0.05; // Affects minimal speed
const segmentInterval = 1000 / 30;

export function createTrailTick(vehicle: number) {
  const boneI = GetEntityBoneIndexByName(vehicle, "wheel_lr");
  const model = GetEntityModel(vehicle);
  const [hitboxMin, hitboxMax] = GetModelDimensions(model);

  const posHistory: [Vector3, Vector3][] = [];
  let lastTimestamp = GetGameTimer();

  let color: IVector3 = [255, 255, 255];
  // TODO: Update color periodically?
  const colorComb = GetVehicleColourCombination(vehicle);
  if (colorComb === -1) {
    color = GetVehicleCustomSecondaryColour(vehicle);
  } else {
    if (model in colors) {
      const colorPreset = colors[model][colorComb];
      if (colorPreset) color = colorPreset;
    }
  }
  color = color.map((v) => Math.floor(Math.min(255, v * brighten))) as IVector3;

  function stop() {
    clearTick(tick);
  }
  const tick = setTick(() => {
    if (!HasStreamedTextureDictLoaded("Deadline")) return RequestStreamedTextureDict("Deadline", true);

    if (!vehicle || !DoesEntityExist(vehicle) || !IsVehicleDriveable(vehicle, false)) {
      return stop();
    }

    const pos = new Vector3(GetWorldPositionOfEntityBone(vehicle, boneI));
    const [_fv, _rv, upVectorRaw, vehPos] = GetEntityMatrix(vehicle);
    const upVector = new Vector3(upVectorRaw);

    const bottom = pos.sub(upVector.mult(extendDown));
    const top = pos.add(upVector.mult(extendUp));
    const newSegment: [Vector3, Vector3] = [top, bottom];

    const timestamp = GetGameTimer();
    if (timestamp - lastTimestamp >= segmentInterval) {
      lastTimestamp = timestamp;

      posHistory.push(newSegment);

      if (posHistory.length > 2) {
        // Progresively remove segments while slow/stopped
        const last = posHistory[posHistory.length - 2];
        if (last[1].sub(bottom).getLength() < minDistace) posHistory.shift();
      }
    }

    // No rendering needed yet
    if (posHistory.length < 2) return;

    // Process
    const _ownTrailThreshold = posHistory.length * (1 - ownTrailThreshold);
    const segments = [...posHistory, newSegment];

    for (let i = posHistory.length; i > 0; i--) {
      if (posHistory.length - i > trailLength) {
        posHistory.shift();
        continue;
      }

      const [top0, bottom0] = segments[i - 1].map((v) => v.toTuple());
      const [top1, bottom1] = segments[i].map((v) => v.toTuple());

      if (posHistory.length > minLength && i < _ownTrailThreshold) {
        const offsets = [
          GetOffsetFromEntityGivenWorldCoords(vehicle, ...bottom0),
          GetOffsetFromEntityGivenWorldCoords(vehicle, ...top0),
        ];

        if (offsets.some((offset) => offset.every((o, i) => (o < 0 ? o > hitboxMin[i] : o < hitboxMax[i])))) {
          SetEntityHealth(vehicle, -4000);
          AddExplosion(vehPos[0], vehPos[1], vehPos[2], 36, 1, true, false, 1);
          stop();
          break;
        }
      }

      const alpha = Math.floor((i / (posHistory.length * fadeOutOffset)) * 255);

      // FIXME: triangles are distinguishable from one of the sides when tiled towards that side
      drawPoly(top0, bottom1, bottom0, color, alpha, 0);
      drawPoly(bottom0, bottom1, top0, color, alpha, 1);
      drawPoly(top0, top1, bottom1, color, alpha, 2);
      drawPoly(top1, top0, bottom1, color, alpha, 3);
    }
  });
  return stop;
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
