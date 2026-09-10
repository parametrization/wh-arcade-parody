export const WIDTH = 640,
  HEIGHT = 640;
export const LANE_Y = [300, 410, 520] as const;
export const laneY = (lane: number) => LANE_Y[lane];
export const crateTop = (lane: number) => laneY(lane) - 18;
export const gateTop = (lane: number) => laneY(lane) - 30;
export const beltTop = (lane: number) => laneY(lane) - 28;
export const layout = { width: WIDTH, height: HEIGHT };
