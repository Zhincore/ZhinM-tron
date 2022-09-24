import { createTrailTick } from "./trail";

let stop: (() => void) | undefined = undefined;

setInterval(() => {
  const ped = PlayerPedId();
  const vehicle = GetVehiclePedIsIn(ped, false);

  if (vehicle && !stop) {
    stop = createTrailTick(vehicle);
  } else if (!vehicle && stop) {
    stop();
    stop = undefined;
  }
}, 10);
