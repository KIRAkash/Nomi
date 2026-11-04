// Structured outputs for every model call that drives UI. Each one is validated before it reaches a screen.
import { z } from 'zod';

export const IssueCategory = z.enum([
  'taste', 'temperature', 'portion', 'presentation', 'wait_time', 'service', 'cleanliness', 'ambience', 'price',
]);

// Menu Snap: menu photo or PDF → dish list (Muse Wonder)
export const MenuDish = z.object({
  name: z.string(),
  category: z.string(),
  price: z.number().nullable().describe('null when the price cannot be read'),
  description: z.string().nullable(),
  veg: z.boolean().nullable(),
  spice: z.number().int().min(0).max(3).nullable(),
  unclear: z.array(z.enum(['name', 'price', 'description'])).describe('fields the model could not read with confidence'),
});
export const MenuExtraction = z.object({ dishes: z.array(MenuDish) });

// Dish enrichment: description → components that become SAM prompts (Muse Spark)
export const ComponentRole = z.enum(['main', 'count', 'placement', 'side']);
export const ComponentProposal = z.object({
  components: z.array(z.object({ name: z.string(), sam_prompt: z.string(), role: ComponentRole })),
});

// Voice spec: transcript → checkable plating rules (Muse Spark)
export const PlatingRule = z.object({
  text: z.string().describe('the rule read back to the chef as one plain sentence'),
  component: z.string(),
  check: z.enum(['position', 'not_overlapping', 'present', 'count', 'on_rim']),
  value: z.string().nullable().describe('for example "2 o\'clock", "rice", "4"'),
  translated_from: z.string().nullable(),
});
export const PlatingRules = z.object({ rules: z.array(PlatingRule) });

// Guest questions per dish: components + rules → up to 3 questions (Muse Spark)
export const GuestQuestion = z.object({
  id: z.string(),
  text: z.string(),
  yes_label: z.string(),
  no_label: z.string(),
  checks: z.string().describe('what in the Golden Plate this answer relates to'),
});
// No maxItems: in strict mode Muse Spark stalls on it for minutes (checked Nov 3); the task keeps the first 5.
export const GuestQuestionProposal = z.object({ questions: z.array(GuestQuestion) });

// Guest plate photo → which dish it is (Muse Spark image understanding)
export const DishRecognition = z.object({
  dish_id: z.string().nullable().describe('null when no menu dish matches'),
  confidence: z.number().min(0).max(1),
  is_food: z.boolean().describe('false means the photo is discarded'),
});

// Feedback tagging + translation (Muse Spark)
export const FeedbackTags = z.object({
  translation_en: z.string(),
  language: z.string(),
  tags: z.array(z.object({ dish_id: z.string().nullable(), label: z.string(), category: IssueCategory, sentiment: z.enum(['positive', 'neutral', 'negative']) })),
  severity: z.enum(['low', 'medium', 'high']),
});

// Reply draft in the guest's language (Muse Spark)
export const ReplyDraft = z.object({ reply: z.string(), reply_en: z.string(), offer: z.string().nullable() });

// Closing photo: only what is visible. No volumes, weights or money (Muse Spark + SAM 3.1)
export const ClosingFlag = z.enum(['missing_lid', 'spill', 'clutter', 'item_left_out', 'door_open']);
export const ClosingCheck = z.object({
  counts: z.array(z.object({ item: z.string(), n: z.number().int().min(0), note: z.string().nullable() })),
  flags: z.array(z.object({ flag: ClosingFlag, where: z.string(), box: z.tuple([z.number(), z.number(), z.number(), z.number()]).nullable() })),
});

// PASS frame gate, on site (local Glimmer): a frame is kept only if a plate is in it; faces are blurred before it leaves
export const PassFrame = z.object({
  plate: z.boolean().describe('a plated dish is fully inside the frame'),
  faces: z.array(z.tuple([z.number(), z.number(), z.number(), z.number()])).describe('each visible face as x1, y1, x2, y2 in 0–1 of the frame'),
});

// PASS check: SAM 3.1 parts measured by the vision worker against the dish's Golden Plate signature
export const PassComponent = z.object({
  name: z.string(),
  colour: z.string(),
  role: z.string(),
  found: z.boolean(),
  count: z.number().int().min(0),
  golden_count: z.number().int().nullable(),
  share: z.number().describe('share of the plate this part covers in the frame, 0–1'),
  golden_share: z.number(),
  area_vs_golden: z.number().int().nullable().describe('percent more (+) or less (−) plate area than the Golden Plate; null when not compared'),
  where: z.string().nullable(),
  golden_where: z.string().nullable(),
  ok: z.boolean(),
  reason: z.string().nullable().describe('the quiet nudge line, e.g. "Fried onions: not found"'),
  kind: z.enum(['missing', 'count', 'area', 'position']).nullable(),
});
export const PassCheck = z.object({
  dish_id: z.string(),
  dish: z.string(),
  golden_version: z.number().int(),
  score: z.number().int().min(0).max(100),
  components: z.array(PassComponent),
  reasons: z.array(z.string()),
  glimmer: z.object({ ran: z.boolean(), plate: z.boolean().nullable(), faces_blurred: z.number().int().min(0), note: z.string().nullable() }),
  // The frame as SAM 3.1 read it, for drawing the outlines: same shape as a Golden Plate read.
  read: z.object({
    size: z.object({ w: z.number(), h: z.number() }),
    plate: z.object({ cx: z.number(), cy: z.number(), r: z.number(), path: z.string() }).nullable(),
    parts: z.array(z.object({
      name: z.string(), colour: z.string(), found: z.boolean(), count: z.number(), share: z.number(), where: z.string().nullable(),
      centre: z.tuple([z.number(), z.number()]).nullable(), paths: z.array(z.string()), boxes: z.array(z.array(z.number())),
    })),
  }),
  frame: z.string().nullable().describe('the frame that was sent to SAM 3.1, when faces were blurred in it'),
});

// NIGHTSHIFT: Muse Wonder plans, four Muse Spark analysts read their facts in parallel, Muse Wonder links them.
// No min/max items in these: in strict mode the models stall on them (checked Nov 3). The API enforces limits after parsing.
export const Analyst = z.enum(['feedback', 'plate', 'stock', 'closing']);
export const NightshiftPlan = z.object({
  focus: z.array(z.object({ analyst: Analyst, question: z.string().describe('what this analyst should look for in its facts, one short sentence') })),
});
export const Finding = z.object({
  analyst: Analyst,
  fact: z.string().describe('a statement that is directly observed in the evidence, with its counts'),
  evidence_ids: z.array(z.string()),
});
export const AnalystReport = z.object({ findings: z.array(Finding.omit({ analyst: true })) });
export const ProposedAction = z.object({
  type: z.enum(['update_sop', 'adjust_order', 'reply_guest']),
  title: z.string(),
  detail: z.string(),
  evidence_ids: z.array(z.string()),
});
export const Briefing = z.object({
  issues: z.array(z.object({ title: z.string(), facts: z.array(Finding), likely_cause: z.string().nullable(), actions: z.array(ProposedAction) })),
  wins: z.array(z.object({ title: z.string(), evidence_ids: z.array(z.string()) })),
});
// Tonight's watch list: the counts are computed from PASS rows by the API, never by a model; Spark writes the reminder.
export const WatchReminders = z.object({ reminders: z.array(z.object({ id: z.string(), reminder: z.string() })) });
export const WatchItem = z.object({ id: z.string(), dish: z.string(), part: z.string(), kind: z.enum(['missing', 'count', 'area', 'position']), n: z.number().int(), of: z.number().int(), fact: z.string(), reminder: z.string().nullable(), plate_ids: z.array(z.string()) });
export const NightshiftResult = z.object({
  plan: NightshiftPlan,
  analysts: z.array(z.object({ analyst: Analyst, findings: z.array(Finding), facts: z.number().int(), ms: z.number() })),
  briefing: Briefing,
  watch: z.array(WatchItem),
  stats: z.object({ notes: z.number().int(), plates: z.number().int(), photos: z.number().int(), stock: z.number().int(), closing: z.number().int() }),
  evidence: z.record(z.string(), z.string()).describe('fact id → the fact, for every id the briefing cites'),
});

// Shift handover voice note → done / pending / problems (Muse Voice Transcribe with speakers, then Muse Spark)
export const HandoverSummary = z.object({
  done: z.array(z.string()),
  pending: z.array(z.string()),
  problems: z.array(z.string()).describe('only problems someone actually said out loud'),
  language: z.string(),
});

// Plating card in a staff member's language (Muse Spark)
export const CardTranslation = z.object({ title: z.string(), steps: z.array(z.string()), watch: z.array(z.string()) });

// Ask Nomi: answers only from the facts it is given, and says so when it cannot (Muse Wonder)
export const AskAnswer = z.object({
  answer: z.string(),
  facts: z.array(z.object({ text: z.string(), source: z.string().describe('which fact id or screen this came from') })),
  refused: z.boolean().describe('true when the question asks for a prediction, money estimate or anything not in the facts'),
});

export type MenuExtraction = z.infer<typeof MenuExtraction>;
export type ComponentProposal = z.infer<typeof ComponentProposal>;
export type PlatingRules = z.infer<typeof PlatingRules>;
export type GuestQuestion = z.infer<typeof GuestQuestion>;
export type GuestQuestionProposal = z.infer<typeof GuestQuestionProposal>;
export type DishRecognition = z.infer<typeof DishRecognition>;
export type FeedbackTags = z.infer<typeof FeedbackTags>;
export type ReplyDraft = z.infer<typeof ReplyDraft>;
export type ClosingCheck = z.infer<typeof ClosingCheck>;
export type Briefing = z.infer<typeof Briefing>;
export type PassFrame = z.infer<typeof PassFrame>;
export type PassCheck = z.infer<typeof PassCheck>;
export type PassComponent = z.infer<typeof PassComponent>;
export type NightshiftPlan = z.infer<typeof NightshiftPlan>;
export type Finding = z.infer<typeof Finding>;
export type AnalystReport = z.infer<typeof AnalystReport>;
export type WatchItem = z.infer<typeof WatchItem>;
export type NightshiftResult = z.infer<typeof NightshiftResult>;
export type HandoverSummary = z.infer<typeof HandoverSummary>;
export type CardTranslation = z.infer<typeof CardTranslation>;
export type AskAnswer = z.infer<typeof AskAnswer>;
