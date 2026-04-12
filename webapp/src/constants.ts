export const defaultInstrumentBlock = "minecraft:dirt";
export const defaultPercussiveBlock = "minecraft:sand";

export const MINI = 18;
export const CELL = 28; // default cell size in pixels

export const instrumentByBlock = {
  "minecraft:acacia_log": "bass",
  "minecraft:sand": "snare",
  "minecraft:glass": "hat",
  "minecraft:stone": "basedrum",
  "minecraft:gold_block": "bell",
  "minecraft:clay": "flute",
  "minecraft:packed_ice": "chime",
  "minecraft:white_wool": "guitar",
  "minecraft:bone_block": "xylophone",
  "minecraft:iron_block": "iron_xylophone",
  "minecraft:soul_sand": "cow_bell",
  "minecraft:pumpkin": "didgeridoo",
  "minecraft:emerald_block": "bit",
  "minecraft:hay_block": "banjo",
  "minecraft:glowstone": "pling",
  "minecraft:dirt": "harp"
};

export const blockByPatchId = {
  2: "minecraft:glowstone",
  4: "minecraft:glowstone",
  5: "minecraft:glowstone",
  8: "minecraft:iron_block",
  9: "minecraft:gold_block",
  10: "minecraft:iron_block",
  11: "minecraft:iron_block",
  12: "minecraft:iron_block",
  13: "minecraft:bone_block",
  14: "minecraft:gold_block",
  24: "minecraft:white_wool",
  25: "minecraft:white_wool",
  26: "minecraft:white_wool",
  27: "minecraft:white_wool",
  28: "minecraft:white_wool",
  29: "minecraft:white_wool",
  30: "minecraft:white_wool",
  31: "minecraft:white_wool",
  32: "minecraft:acacia_log",
  33: "minecraft:acacia_log",
  34: "minecraft:acacia_log",
  35: "minecraft:acacia_log",
  36: "minecraft:acacia_log",
  37: "minecraft:acacia_log",
  38: "minecraft:acacia_log",
  39: "minecraft:acacia_log",
  72: "minecraft:clay",
  73: "minecraft:clay",
  74: "minecraft:clay",
  75: "minecraft:clay",
  76: "minecraft:clay",
  77: "minecraft:clay",
  78: "minecraft:clay",
  79: "minecraft:clay",
  80: "minecraft:emerald_block",
  105: "minecraft:hay_block",
  112: "minecraft:packed_ice"
};

export const blockByPercussiveNote = {
  35: "minecraft:stone",
  36: "minecraft:stone",
  38: "minecraft:sand",
  40: "minecraft:sand",
  42: "minecraft:glass",
  44: "minecraft:glass",
  46: "minecraft:glass",
  56: "minecraft:soul_sand"
};

export const notePitchNames = [
  "F#/Gb",
  "G",
  "G#/Ab",
  "A",
  "A#/Bb",
  "B",
  "C",
  "C#/Db",
  "D",
  "D#/Eb",
  "E",
  "F"
];

export const noteColorByStep = [
  "#77D700",
  "#95C000",
  "#B2A500",
  "#CC8600",
  "#E26500",
  "#F34100",
  "#FC1E00",
  "#FE000F",
  "#F70033",
  "#E8005A",
  "#CF0083",
  "#AE00A9"
];

export const supportColorByBlock = {
  acacia_log: "#8b5a2b",
  sand: "#d4be7d",
  glass: "#8cd9e9",
  stone: "#8f9497",
  gold_block: "#f3cf3f",
  clay: "#b9a6a2",
  packed_ice: "#bce8ff",
  white_wool: "#f4f2e9",
  bone_block: "#e3dcc2",
  iron_block: "#c4cbd0",
  soul_sand: "#6f5b45",
  pumpkin: "#d27720",
  emerald_block: "#3cc76f",
  hay_block: "#d6c66a",
  glowstone: "#f2cb6c",
  copper_block: "#c97b5d",
  exposed_copper: "#bd906a",
  weathered_copper: "#77a98a",
  oxidized_copper: "#4fab8d",
  dirt: "#7f5a34"
};
