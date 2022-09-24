import { IVector3 } from "$root/Vector3";

const colors: Record<number, IVector3[]> = {
  [GetHashKey("shotaro")]: [
    [255, 25, 25],
    [25, 255, 247],
    [171, 255, 25],
    [255, 159, 25],
    [255, 255, 255],
  ],

  [GetHashKey("deathbike2")]: [
    [255, 255, 255],
    [25, 255, 247],
  ],
};

export default colors;
