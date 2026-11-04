// A18 · Today: last night's NIGHTSHIFT briefing. "Run Nightshift now" runs it for real through the API: Muse Wonder plans,
// four Muse Spark analysts read the night's facts in parallel, Muse Wonder links them, and each stage shows as it happens.
// Every proposed action waits here for a human. Managers see urgent notes first. Before a run, the seed briefing shows.
import { Button, Card, Chip, H1, H2, Label, Num, Row, Screen, SquishIn, Squishy, Sub, color, font, shadow } from '@nomi/ui';
import type { NightshiftResult } from '@nomi/shared';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AiTag, Stat, TopBar, WorkLine, Why } from '@/components/kit';
import { BRIEFING, NOTES, type Action, type BriefIssue, type EvidenceItem } from '@/lib/mock';
import { startNightshift, useNightshift } from '@/lib/nightshift';
import { can, ROLE_PERSON, useSession } from '@/lib/session';

const ANALYST_TONE = { Feedback: color.skySoft, Plate: color.saffronSoft, Stock: color.mintSoft, Closing: color.pinkSoft } as const;
const ACTION_ICON: Record<Action['type'], string> = { adjust_order: 'Order', update_sop: 'SOP card', reply_guest: 'Guests' };

function Arrow() {
  return (
    <View style={{ alignItems: 'center', height: 18 }}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color.ink2} strokeWidth={2.6} strokeLinecap="round"><Path d="M12 3v16M6 13l6 6 6-6" /></Svg>
    </View>
  );
}

type Shown = Omit<BriefIssue, 'likelyCause'> & { likelyCause: string | null };
type AnalystKey = NightshiftResult['analysts'][number]['analyst'];
const LABEL: Record<AnalystKey, BriefIssue['chain'][number]['analyst']> = { feedback: 'Feedback', plate: 'Plate', stock: 'Stock', closing: 'Closing' };

/** The fact behind an id, as a line in the evidence sheet. */
function evidenceItem(id: string, text: string): EvidenceItem {
  const [kind, name] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)];
  if (kind === 'note') return { kind: 'quote', title: `Guest note ${name}`, detail: text, tone: 'tomato' };
  if (kind === 'plate') return { kind: 'plate', title: `PASS plate ${name}`, detail: text, tone: 'saffron' };
  if (kind === 'dish') return { kind: 'count', title: `PASS counts · ${name}`, detail: text, tone: 'saffron' };
  if (kind === 'stock') return { kind: 'count', title: `Shelf count · ${name}`, detail: text, tone: 'mint' };
  if (kind === 'handover') return { kind: 'quote', title: 'Shift handover', detail: text, tone: 'sky' };
  return { kind: 'photo', title: 'Closing round', detail: text, tone: 'sky' };
}

/** A live briefing in the shape the cards draw; every fact keeps its evidence. */
function liveIssues(r: NightshiftResult): Shown[] {
  const ev = (ids: string[]) => ids.map((id) => evidenceItem(id, r.evidence[id] ?? id));
  return r.briefing.issues.map((iss, i) => ({
    id: `live-${i}`,
    title: iss.title,
    chain: iss.facts.map((f) => ({ analyst: LABEL[f.analyst], fact: f.fact, evidence: ev(f.evidence_ids) })),
    likelyCause: iss.likely_cause,
    actions: iss.actions.map((a, j) => ({ id: `live-${i}-${j}`, type: a.type, title: a.title, detail: a.detail, status: 'proposed' as const })),
  }));
}

function IssueCard({ issue, index, mayApprove }: { issue: Shown; index: number; mayApprove: boolean }) {
  const [acts, setActs] = useState(issue.actions);
  const set = (id: string, status: Action['status']) => setActs((a) => a.map((x) => (x.id === id ? { ...x, status } : x)));
  return (
    <SquishIn index={index}>
      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Label>Issue {index}</Label>
            <H2>{issue.title}</H2>
          </View>
        </Row>

        <View>
          {issue.chain.map((c, i) => (
            <View key={i}>
              {i > 0 && <Arrow />}
              <View style={{ backgroundColor: ANALYST_TONE[c.analyst], borderRadius: 18, padding: 12, gap: 8 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.ink2, textTransform: 'uppercase', letterSpacing: 1 }}>{c.analyst} analyst</Text>
                  <Why title={c.fact} items={c.evidence} label={`${c.evidence.length} proof${c.evidence.length > 1 ? 's' : ''}`} />
                </Row>
                <Text style={{ fontFamily: font.bodySemi, fontSize: 15, lineHeight: 21, color: color.ink }}>{c.fact}</Text>
              </View>
            </View>
          ))}
          {issue.likelyCause && (
            <>
              <Arrow />
              <View style={{ backgroundColor: color.ink, borderRadius: 18, padding: 12, gap: 4 }}>
                <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.saffron, textTransform: 'uppercase', letterSpacing: 1 }}>Likely cause</Text>
                <Text style={{ fontFamily: font.bodySemi, fontSize: 15, lineHeight: 21, color: color.bg }}>{issue.likelyCause}</Text>
              </View>
            </>
          )}
        </View>

        {acts.length > 0 && <Label>Proposed · waiting for you</Label>}
        {acts.map((a) => (
          <View key={a.id} style={{ backgroundColor: color.bg, borderRadius: 18, padding: 12, gap: 8, opacity: a.status === 'rejected' ? 0.5 : 1 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Chip tone="sky" label={ACTION_ICON[a.type]} />
              {a.status === 'approved' && <Chip tone="mint" label="Approved" />}
              {a.status === 'rejected' && <Chip tone="white" label="Skipped" />}
            </Row>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.ink }}>{a.title}</Text>
            <Sub style={{ fontSize: 13 }}>{a.detail}</Sub>
            {a.status === 'proposed' && mayApprove && (
              <Row>
                <Button small title="Approve" style={{ flex: 1 }} onPress={() => set(a.id, 'approved')} />
                <Button small kind="white" title="Skip" style={{ flex: 1 }} onPress={() => set(a.id, 'rejected')} />
              </Row>
            )}
          </View>
        ))}
      </Card>
    </SquishIn>
  );
}

const ANALYSTS: { id: AnalystKey; label: string }[] = [
  { id: 'feedback', label: 'Feedback analyst' }, { id: 'plate', label: 'Plate analyst' }, { id: 'stock', label: 'Stock analyst' }, { id: 'closing', label: 'Closing analyst' },
];

/** Seconds since `from`, ticking while `on`. */
function useSince(from: number | null, on: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [on]);
  return from ? Math.max(0, Math.round((now - from) / 1000)) : 0;
}

export default function Today() {
  const { role } = useSession();
  const night = useNightshift();
  const running = night.status === 'running';
  const secs = useSince(night.startedAt, running);
  const live = night.result;
  const urgent = NOTES.filter((n) => n.severity === 'high' && n.status === 'new');
  const mayApprove = can(role, 'approve_action');
  const issues: Shown[] = live ? liveIssues(live) : BRIEFING.issues;
  const wins = live
    ? live.briefing.wins.map((w) => ({ title: w.title, detail: `From ${w.evidence_ids.length} fact${w.evidence_ids.length > 1 ? 's' : ''}`, evidence: w.evidence_ids.map((id) => evidenceItem(id, live.evidence[id] ?? id)) }))
    : BRIEFING.wins.map((w) => ({ ...w, evidence: [] as EvidenceItem[] }));
  const pending = issues.reduce((n, i) => n + i.actions.length, 0);
  const stats = live?.stats ?? BRIEFING.stats;
  const st = night.stages;
  const question = (a: AnalystKey) => night.plan?.focus.find((f) => f.analyst === a)?.question;
  const showStages = running || night.status === 'error' || !!live;

  return (
    <Screen scroll style={{ paddingBottom: 120 }}>
      <TopBar sub={BRIEFING.date} title={`Good morning, ${ROLE_PERSON[role].name}`} />

      {urgent.map((n) => (
        <SquishIn key={n.id}>
          <Squishy accessibilityRole="button" accessibilityLabel={`Urgent note from ${n.table}`} onPress={() => router.push({ pathname: '/note/[id]', params: { id: n.id } })}
            style={{ backgroundColor: color.tomato, borderRadius: 24, padding: 14, gap: 4, ...shadow(2) }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: '#fff', letterSpacing: 1, textTransform: 'uppercase' }}>Urgent · {n.table} · {n.ago}</Text>
            <Text style={{ fontFamily: font.bodySemi, fontSize: 15, color: '#fff' }} numberOfLines={2}>“{n.original}”</Text>
          </Squishy>
        </SquishIn>
      ))}

      <SquishIn index={1}>
        <Card style={{ backgroundColor: color.ink, gap: 12 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.saffron, letterSpacing: 1.1, textTransform: 'uppercase' }}>Nightshift briefing</Text>
              <H1 style={{ color: color.bg, fontSize: 24 }}>{running && !live ? 'Reading the night…' : `${issues.length} issue${issues.length === 1 ? '' : 's'}, ${wins.length} win${wins.length === 1 ? '' : 's'}`}</H1>
            </View>
            {!(running && !live) && <Num style={{ color: color.saffron, fontSize: 30 }}>{pending}</Num>}
          </Row>
          <Text style={{ fontFamily: font.body, fontSize: 13, color: color.saffronSoft }}>
            {running && !live ? 'Running live on last night\'s facts'
              : `${live ? `Ran live just now in ${Math.round(live.ms / 1000)} s` : `Seed briefing, ran at ${BRIEFING.ranAt} in ${BRIEFING.durationS} s`} · ${pending} actions wait for approval`}
          </Text>
          {!(running && !live) && (
            <Row gap={8}>
              <Stat t="saffron" value={stats.notes} label="guest notes" />
              <Stat t="saffron" value={stats.plates} label="plates" />
              <Stat t="saffron" value={stats.photos} label="guest photos" />
            </Row>
          )}

          {showStages && (
            <View style={{ gap: 8, backgroundColor: '#2A2440', borderRadius: 18, padding: 12 }}>
              <WorkLine dark state={st.plan?.state ?? 'run'} ms={st.plan?.ms} model="Muse Wonder"
                text={st.plan?.state === 'done' ? 'Planned what each analyst looks at' : 'Muse Wonder is planning the review…'} />
              {ANALYSTS.map((a) => {
                const s = st[a.id];
                const n = s?.facts;
                const text = s?.state === 'done' ? `${a.label} · ${s.findings} finding${s.findings === 1 ? '' : 's'} from ${n} facts`
                  : s?.state === 'skip' || s?.state === 'fail' ? `${a.label} · ${s.text}`
                  : `${a.label}${n !== undefined ? ` · ${n} facts` : ''}${s?.state === 'run' ? ' · reading…' : ''}`;
                return (
                  <View key={a.id} style={{ gap: 2 }}>
                    <WorkLine dark state={s?.state === 'run' || s?.state === 'done' || s?.state === 'skip' || s?.state === 'fail' ? s.state : 'wait'} ms={s?.ms} text={text} model="Muse Spark" />
                    {question(a.id) && <Text style={{ fontFamily: font.body, fontSize: 12, color: color.saffronSoft, paddingLeft: 34 }}>“{question(a.id)}”</Text>}
                  </View>
                );
              })}
              <WorkLine dark state={st.merge?.state ?? 'wait'} ms={st.merge?.ms} model="Muse Wonder"
                text={st.merge?.state === 'done' ? 'Linked facts into issues and likely causes' : st.merge?.state === 'run' ? 'Muse Wonder is linking facts into causes…' : 'Link facts into causes'} />
              {night.status === 'error' && <Text style={{ fontFamily: font.bodySemi, fontSize: 13, color: color.saffron }}>{night.error} Try again in a minute.</Text>}
            </View>
          )}

          <Row gap={6} style={{ justifyContent: 'space-between' }}>
            <Row gap={6}><AiTag model="Muse Wonder" /><AiTag model="Muse Spark" /></Row>
            <Button small kind="saffron" title={running ? `Running… ${secs} s` : live ? 'Run again' : 'Run Nightshift now'} disabled={running} onPress={startNightshift} />
          </Row>
        </Card>
      </SquishIn>

      {(!running || live) && issues.map((iss, i) => <IssueCard key={iss.id} issue={iss} index={i + 1} mayApprove={mayApprove} />)}

      {(!running || live) && wins.length > 0 && <Label>Wins</Label>}
      {(!running || live) && wins.map((w, i) => (
        <SquishIn key={w.title} index={i}>
          <Card soft style={{ backgroundColor: color.mintSoft, gap: 6 }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.mintInk }}>{w.title}</Text>
            <Row style={{ justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: font.body, fontSize: 13, color: color.mintInk, flex: 1 }}>{w.detail}</Text>
              {w.evidence.length > 0 && <Why title={w.title} items={w.evidence} />}
            </Row>
          </Card>
        </SquishIn>
      ))}

      {role === 'owner' && <Button title="Ask Nomi a question" onPress={() => router.push('/ask')} />}
    </Screen>
  );
}
