import { IVector3 } from "$root/Vector3";
import { loadMap } from "./mapManager";
import { createTrailTick } from "./trail";

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
    const vehicle = CreateVehicle(model, ...coords, heading, true, false);
    SetVehicleOnGroundProperly(vehicle);
    SetPedIntoVehicle(ped, vehicle, -1);
    SetVehicleEngineOn(vehicle, true, true, false);
    SetVehicleRadioEnabled(vehicle, false);
    SetVehicleAsNoLongerNeeded(vehicle);

    TaskVehicleTempAction(ped, vehicle, 9, 3000);
    setTimeout(() => {
      createTrailTick(vehicle);
    }, 3000);
  },
  false,
);

async function sleep(ms: number) {
  await new Promise<void>((r) => setTimeout(r, ms));
}
