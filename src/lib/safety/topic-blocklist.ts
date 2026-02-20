type BlockResult = { blocked: boolean; reason?: string };

const EDUCATIONAL_ALLOWLIST = [
  "nuclear physics",
  "history of warfare",
  "world war ii",
  "chemistry",
  "cybersecurity",
  "photosynthesis",
];

const BLOCK_RULES: Array<{ reason: string; test: RegExp }> = [
  {
    reason: "Detailed instructions for creating weapons or explosives are not allowed.",
    test: /(?:how\s+to|instructions?\s+for|guide\s+to|steps?\s+to)\s+(?:make|build|create|assemble|synthesize)\s+(?:an?\s+)?(?:bomb|explosive|ied|molotov|grenade|firearm|ghost\s+gun|weapon|poison|nerve\s+agent)/i,
  },
  {
    reason: "Instructions for illegal drug synthesis are not allowed.",
    test: /(?:how\s+to|instructions?\s+for|guide\s+to|steps?\s+to)?\s*(?:make|cook|synthesize|manufacture|produce)\s+(?:meth(?:amphetamine)?|crystal\s*meth|heroin|fentanyl|mdma|ecstasy|lsd|cocaine)/i,
  },
  {
    reason: "Cyberattacks on specific targets are not allowed.",
    test: /(?:how\s+to|ways?\s+to|guide\s+to|steps?\s+to)\s+(?:hack|breach|phish|ddos|exploit|crack)\s+(?:into\s+)?(?:a\s+)?(?:bank\s+account|email\s+account|social\s+media\s+account|server|website|wifi|router|someone'?s\s+account|specific\s+target)/i,
  },
  {
    reason: "Content related to child sexual abuse or exploitation is not allowed.",
    test: /(?:child\s+sexual\s+abuse|csam|child\s+exploitation|sexual\s+content\s+with\s+minors|minor\s+sexual\s+content)/i,
  },
  {
    reason: "Detailed instructions for violence or terrorism are not allowed.",
    test: /(?:how\s+to|instructions?\s+for|guide\s+to|steps?\s+to)\s+(?:carry\s+out|plan|execute|commit|perform)\s+(?:an?\s+)?(?:terror(?:ist)?\s+attack|mass\s+shooting|assassination|violent\s+attack)/i,
  },
];

export function isBlockedTopic(topic: string): BlockResult {
  const normalizedTopic = topic.trim().toLowerCase();

  if (!normalizedTopic) {
    return { blocked: false };
  }

  if (EDUCATIONAL_ALLOWLIST.some((phrase) => normalizedTopic.includes(phrase))) {
    return { blocked: false };
  }

  for (const rule of BLOCK_RULES) {
    if (rule.test.test(normalizedTopic)) {
      return { blocked: true, reason: rule.reason };
    }
  }

  return { blocked: false };
}
