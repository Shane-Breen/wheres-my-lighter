import { makeSeed } from "@/lib/avatarSeed";

type AvatarInput = {
  lighterId: string;
  nightRatio: number;
  countries: string[];
  cities: string[];
  totalTaps: number;
};

export type AvatarResult = {
  name: string;
  story: string[];
  mood: "wobble" | "calm" | "chaos";
  seed: string;
  debug_rule: string;
};

function pick(arr: string[], seed: string) {
  const n = parseInt(seed.slice(0, 6), 16) || 0;
  return arr[n % arr.length];
}

export function generateAvatarDebug(input: AvatarInput): AvatarResult {
  const start = input.countries[0] || "?";
  const end = input.countries[input.countries.length - 1] || "?";
  const night = input.nightRatio;

  const baseSeed = makeSeed(
    `${input.lighterId}|${start}|${end}|${input.countries.length}|${input.cities.length}|${night.toFixed(2)}|${input.totalTaps}`
  );

  const extraLines = [
    "Has no memory of consenting to this itinerary.",
    "Emotionally attached to last orders.",
    "Operates on vibes, not plans.",
    "Frequently misplaced. Rarely gone.",
    "Has seen things. Won’t elaborate.",
    "Allergic to bedtime.",
  ];

  if (night >= 0.6 && input.totalTaps >= 5) {
    return {
      name: "The Party Liability",
      mood: "wobble",
      seed: makeSeed(baseSeed + "|party"),
      story: ["Never invited.", "Always there.", pick(extraLines, baseSeed)],
      debug_rule: "night>=0.6 && totalTaps>=5",
    };
  }

  if (input.countries.length >= 3) {
    return {
      name: "The Border Hopper",
      mood: "chaos",
      seed: makeSeed(baseSeed + "|border"),
      story: ["Never stayed long.", "Always crossed lines drawn by others.", pick(extraLines, baseSeed)],
      debug_rule: "countries>=3",
    };
  }

  if (input.totalTaps >= 10 && input.cities.length <= 2) {
    return {
      name: "The Quiet Local",
      mood: "calm",
      seed: makeSeed(baseSeed + "|local"),
      story: ["Didn’t go far.", "Still made the rounds.", pick(extraLines, baseSeed)],
      debug_rule: "totalTaps>=10 && cities<=2",
    };
  }

  return {
    name: "The Pocket Nomad",
    mood: "calm",
    seed: makeSeed(baseSeed + "|nomad"),
    story: ["Small flame. Big personality.", "Moves when it feels like it.", pick(extraLines, baseSeed)],
    debug_rule: "default",
  };
}
