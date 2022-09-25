/*
 * Stolen from the FxDK map editor
 */
import { IVector3 } from "$root/Vector3";
import Flatbush from "flatbush";

const LOAD_MODEL = -2;
const MODEL_LOADING = -1;

const DATA_MODEL = 0;
const DATA_MATRIX = 1;
const DATA_ROT = 2;
const DATA_EVCREATED = 3;
const DATA_EVDELETED = 4;
const DATA_COLOR = 5; // NONSTANDARD

const SEARCH_BOX = 50;

const WEEntityMatrixIndex = {
  RX: 0,
  RY: 1,
  RZ: 2,
  RW: 3,
  FX: 4,
  FY: 5,
  FZ: 6,
  FW: 7,
  UX: 8,
  UY: 9,
  UZ: 10,
  UW: 11,
  AX: 12,
  AY: 13,
  AZ: 14,
  AW: 15,
};

const objects: Record<string, number> = {};
let tick: number;

export interface Map {
  mai: number[];
  mad: [
    /** Hash */
    number,
    /** Matrix */
    number[],
    /** Rotation */
    IVector3,
    /** Created event */
    string,
    /** Deleted event */
    string,
  ][];
}

export function loadMap(mapName: string) {
  if (tick) throw new Error("A map is laready loaded");

  const map = JSON.parse(LoadResourceFile(GetCurrentResourceName(), `maps/${mapName}.json`));
  const mai = Flatbush.from(new Uint8Array(map.mai).buffer);
  const { mad } = map;

  tick = setTick(() => {
    const [x, y] = GetEntityCoords(PlayerPedId(), false);
    const objectIndices = mai.search(x - SEARCH_BOX, y - SEARCH_BOX, x + SEARCH_BOX, y + SEARCH_BOX).map(String);

    for (const i of objectIndices) {
      if (i in objects === false) {
        objects[i] = LOAD_MODEL;
      }
    }

    for (const i in objects) {
      const handle = objects[i];
      const data = mad[+i];

      if (objectIndices.indexOf(i) === -1) {
        if (handle > MODEL_LOADING) {
          DeleteObject(handle);

          if (data[DATA_EVDELETED]) {
            emit(data[DATA_EVDELETED], handle);
          }
        }

        delete objects[i];
      } else if (handle === LOAD_MODEL) {
        RequestModel(data[DATA_MODEL]);
        objects[i] = MODEL_LOADING;
      } else if (handle === MODEL_LOADING) {
        if (HasModelLoaded(data[DATA_MODEL])) {
          const mat = data[DATA_MATRIX];

          const handle = (objects[i] = CreateObject(
            data[DATA_MODEL],
            mat[WEEntityMatrixIndex.AX],
            mat[WEEntityMatrixIndex.AY],
            mat[WEEntityMatrixIndex.AZ],
            false,
            false,
            false,
          ));

          if (data[DATA_COLOR]) SetObjectTextureVariation(handle, data[DATA_COLOR]);

          FreezeEntityPosition(handle, true);

          applyAdditionMatrix(handle, mat, data[DATA_ROT]);

          if (data[DATA_EVCREATED]) {
            emit(data[DATA_EVCREATED], handle);
          }
        }
      }
    }
  });
}

export function unloadMap() {
  if (tick) clearTick(tick);
}

function applyAdditionMatrix(entity: number, mat: number[], rot: IVector3) {
  SetEntityCoords(
    entity,
    mat[WEEntityMatrixIndex.AX],
    mat[WEEntityMatrixIndex.AY],
    mat[WEEntityMatrixIndex.AZ],
    false,
    false,
    false,
    false,
  );

  SetEntityRotation(entity, rot[0], rot[1], rot[2], 2, false);

  SetEntityMatrix(
    entity,
    // right
    mat[4],
    mat[5],
    mat[6],
    // forward
    mat[0],
    mat[1],
    mat[2],
    // up
    mat[8],
    mat[9],
    mat[10],
    // at
    mat[12],
    mat[13],
    mat[14],
  );
}
