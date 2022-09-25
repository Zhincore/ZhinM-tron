import { IVector3 } from "$root/Vector3";
import { loadMap } from "./mapManager";
import { TronTrail } from "./TronTrail";
import colors from "./colorPresets";

loadMap("testArena");

const coords: IVector3 = [24.826461791992, -158.33323669434, 215.31169128418];
const heading = 0;
const model = GetHashKey("shotaro");

RegisterCommand(
  "tron",
  async () => {
    while (!HasModelLoaded(model)) {
      RequestModel(model);
      await sleep(0);
    }
    const ped = PlayerPedId();
    const vehicle = CreateVehicle(model, ...coords, heading, true, true);
    SetVehicleOnGroundProperly(vehicle);
    SetPedIntoVehicle(ped, vehicle, -1);
    SetVehicleEngineOn(vehicle, true, true, false);
    SetRadioToStationIndex(0);
    SetVehicleRadioEnabled(vehicle, false);
    SetVehicleAsNoLongerNeeded(vehicle);

    TaskVehicleTempAction(ped, vehicle, 9, 3000);

    let color: IVector3 = [255, 255, 255];
    const colorComb = GetVehicleColourCombination(vehicle);
    if (colorComb === -1) {
      color = GetVehicleCustomSecondaryColour(vehicle);
    } else {
      if (model in colors) {
        const colorPreset = colors[model][colorComb];
        if (colorPreset) color = colorPreset;
      }
    }
    color = color.map((v) => Math.floor(Math.min(255, v * 1.1))) as IVector3;

    setTimeout(() => {
      const trail = new TronTrail(vehicle, { color });
      trail.start();
    }, 3000);
  },
  false,
);

async function sleep(ms: number) {
  await new Promise<void>((r) => setTimeout(r, ms));
}
