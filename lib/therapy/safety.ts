export interface CrisisContact {
  country: string;
  name: string;
  phone: string;
  website: string;
}

export const CRISIS_RESOURCES: CrisisContact[] = [
  {
    country: 'Deutschland',
    name: 'Telefonseelsorge (kostenfrei & anonym)',
    phone: '0800 111 0 111 / 0800 111 0 222 / 116 123',
    website: 'https://www.telefonseelsorge.de',
  },
  {
    country: 'Österreich',
    name: 'Telefonseelsorge',
    phone: '142',
    website: 'https://www.telefonseelsorge.at',
  },
  {
    country: 'Schweiz',
    name: 'Die Dargebotene Hand',
    phone: '143',
    website: 'https://www.143.ch',
  },
  {
    country: 'International / Europa',
    name: 'Notruf & Krisendienst',
    phone: '112',
    website: 'https://findahelpline.com',
  },
];

const ACUTE_RISK_KEYWORDS = [
  'suizid',
  'umbringen',
  'leben beenden',
  'nicht mehr leben',
  'sterben will',
  'selbstmord',
  'mich töten',
  'keinen sinn mehr',
  'schluss machen will',
];

export function evaluateSafetyRisk(message: string): {
  isHighRisk: boolean;
  deescalationMessage?: string;
  resources: CrisisContact[];
} {
  const lower = message.toLowerCase();
  const matched = ACUTE_RISK_KEYWORDS.some((kw) => lower.includes(kw));

  if (matched) {
    return {
      isHighRisk: true,
      deescalationMessage: `Ich höre, wie schwer und belastend deine Situation gerade ist. Als KI-Begleiter kann ich dir in einem akuten Notfall nicht die menschliche und ärztliche Unterstützung bieten, die du jetzt verdienst.

Bitte wende dich umgehend an professionelle, vertrauliche und kostenfreie Unterstützung:
- **Deutschland:** Telefonseelsorge unter **0800 111 0 111** oder **116 123**
- **Österreich:** Notruf **142**
- **Schweiz:** Die Dargebotene Hand **143**
- **Weltweit & Unterwegs:** Finde Notfallnummern unter **https://findahelpline.com** oder wähle den Notruf **112**.

Du bist mit diesem Zustand nicht allein – nimm bitte direkt Kontakt zu einer dieser Stellen oder einer vertrauten Person auf.`,
      resources: CRISIS_RESOURCES,
    };
  }

  return {
    isHighRisk: false,
    resources: CRISIS_RESOURCES,
  };
}
