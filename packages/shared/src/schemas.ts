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
export const GuestQuestionProposal = z.object({ questions: z.array(GuestQuestion).max(5) });

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

// NIGHTSHIFT: findings from each analyst, then the briefing (Muse Wonder + Spark sub-agents)
export const Finding = z.object({
  analyst: z.enum(['feedback', 'plate', 'stock', 'closing']),
  fact: z.string().describe('a statement that is directly observed in the evidence'),
  evidence_ids: z.array(z.string()).min(1),
});
export const ProposedAction = z.object({
  type: z.enum(['update_sop', 'adjust_order', 'reply_guest']),
  title: z.string(),
  detail: z.string(),
  evidence_ids: z.array(z.string()).min(1),
});
export const Briefing = z.object({
  issues: z.array(z.object({ title: z.string(), facts: z.array(Finding), likely_cause: z.string().nullable(), actions: z.array(ProposedAction) })).max(3),
  wins: z.array(z.object({ title: z.string(), evidence_ids: z.array(z.string()) })),
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
