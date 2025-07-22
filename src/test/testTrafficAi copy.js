function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Loại bỏ markdown wrapper nếu có
let raw = $input.first().json.output;

if (typeof raw === "string") {
  raw = raw.replace(/^```(?:json)?\n/, "").replace(/\n```$/, "");
}

const input = JSON.parse(raw);

const topic = input.topic;

const styles = [
  "bold-opener",
  "emoji-lead",
  "question",
  "direct",
  "hook-line",
  "shock-statement",
  "stat-opener",
  "quote-style",
  "timeline-style",
  "story-intro",
];

const emojiModes = ["none", "one", "auto", "more-than-ten"];
const tones = [
  "educational",
  "fun",
  "serious",
  "builder",
  "hype",
  "casual",
  "skeptical",
  "visionary",
];
const angles = [
  "Focus on burn model",
  "No VC unlocks / fair launch",
  "Community-first allocation",
  "Incentive for validators",
  "Revenue-based distribution",
  "Token as access key",
  "Real utility vs speculative value",
  "Inflation vs deflation control",
  "Transparent vesting schedule",
  "Supply cap enforcement",
  "Modular design advantage",
  "Avoiding bridge dependency",
  "Native integration with Bitcoin",
  "Scalability through ZK or off-chain logic",
  "Trustless interoperability",
  "Developer-centric architecture",
  "Gas optimization built-in",
  "Self-custody by design",
  "Real yield vs staking illusion",
  "Programmable architecture",
  "Community-led testnet",
  "Incentivizing real usage, not speculation",
  "Decentralization is enforced, not promised",
  "Onboarding normies vs builders",
  "Designed for long-term sustainability",
  "Reward mechanism without Ponzinomics",
  "Less hype, more shipping",
  "Protocol growth tied to user value",
];

// Gán giá trị có sẵn hoặc random
const style = input.style || pickRandom(styles);
const emojiMode = input.emojiMode || pickRandom(emojiModes);
const tone = input.tone || pickRandom(tones);
const themeLine =
  input.themeLine !== undefined ? input.themeLine : Math.random() < 0.1;
const angle = input.angle || pickRandom(angles);
const nametag = input.nametag || ""; // fallback nếu chưa có

return {
  json: {
    ...input,
    topic,
    style,
    emojiMode,
    themeLine,
    tone,
    angle,
    nametag,
  },
};
