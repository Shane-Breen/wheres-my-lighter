type AvatarInput = {
  nightRatio: number;     // 0..1
  countriesCount: number;
  citiesCount: number;
  totalTaps: number;
};

type AvatarResult = {
  name: string;
  story: string[];
  debug_rule: string; // tells you which rule fired
};

export function generateAvatarDebug(input: AvatarInput): AvatarResult {
  const night = input.nightRatio;

  // 1) The Party Liability
  // mostly night activity + decent tap volume
  if (night >= 0.6 && input.totalTaps >= 5) {
    return {
      name: "The Party Liability",
      story: [
        "Never invited.",
        "Always there.",
        "Usually appears near closing time.",
      ],
      debug_rule: "night>=0.6 && totalTaps>=5",
    };
  }

  // 2) The Border Hopper
  // lots of movement variety
  if (input.countriesCount >= 3) {
    return {
      name: "The Border Hopper",
      story: [
        "Never stayed long.",
        "Always crossed lines drawn by others.",
        "Has no concept of a ‘quiet night’.",
      ],
      debug_rule: "countriesCount>=3",
    };
  }

  // 3) The Quiet Local
  // many taps, not many places
  if (input.totalTaps >= 10 && input.citiesCount <= 2) {
    return {
      name: "The Quiet Local",
      story: [
        "Didn’t go far.",
        "Still made the rounds.",
        "A town legend in pocket-sized form.",
      ],
      debug_rule: "totalTaps>=10 && citiesCount<=2",
    };
  }

  // Default: Pocket Nomad
  return {
    name: "The Pocket Nomad",
    story: [
      "Small flame. Big personality.",
      "Moves when it feels like it.",
      "Somehow always comes back.",
    ],
    debug_rule: "default",
  };
}
