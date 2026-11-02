// A18 · Today: last night's NIGHTSHIFT briefing. Muse Wonder planned it, four Muse Spark analysts read the evidence in parallel,
// and every proposed action waits here for a human. Managers see urgent notes first.
import { Button, Card, Chip, H1, H2, Label, Num, Row, Screen, SquishIn, Squishy, Sub, color, font, shadow } from '@nomi/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AiTag, Stat, TopBar, WorkLine, Why, useSteps } from '@/components/kit';
import { BRIEFING, NOTES, type Action, type BriefIssue } from '@/lib/mock';
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

function IssueCard({ issue, index, mayApprove }: { issue: BriefIssue; index: number; mayApprove: boolean }) {
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
          <Arrow />
          <View style={{ backgroundColor: color.ink, borderRadius: 18, padding: 12, gap: 4 }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.saffron, textTransform: 'uppercase', letterSpacing: 1 }}>Likely cause</Text>
            <Text style={{ fontFamily: font.bodySemi, fontSize: 15, lineHeight: 21, color: color.bg }}>{issue.likelyCause}</Text>
          </View>
        </View>

        <Label>Proposed · waiting for you</Label>
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

const ANALYSTS = ['Feedback analyst · 47 notes', 'Plate analyst · 212 plates', 'Stock analyst · 7 shelf scans', 'Closing analyst · 6 spots'];

export default function Today() {
  const { role } = useSession();
  const run = useSteps(4, 750);
  const urgent = NOTES.filter((n) => n.severity === 'high' && n.status === 'new');
  const mayApprove = can(role, 'approve_action');
  const pending = BRIEFING.issues.reduce((n, i) => n + i.actions.length, 0);

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
            <View>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: color.saffron, letterSpacing: 1.1, textTransform: 'uppercase' }}>Nightshift briefing</Text>
              <H1 style={{ color: color.bg, fontSize: 24 }}>{BRIEFING.issues.length} issues, {BRIEFING.wins.length} wins</H1>
            </View>
            <Num style={{ color: color.saffron, fontSize: 30 }}>{pending}</Num>
          </Row>
          <Text style={{ fontFamily: font.body, fontSize: 13, color: color.saffronSoft }}>Ran at {BRIEFING.ranAt} in {BRIEFING.durationS}s · {pending} actions wait for approval</Text>
          <Row gap={8}>
            <Stat t="saffron" value={BRIEFING.stats.notes} label="guest notes" />
            <Stat t="saffron" value={BRIEFING.stats.plates} label="plates" />
            <Stat t="saffron" value={BRIEFING.stats.photos} label="guest photos" />
          </Row>
          <Row gap={6}><AiTag model="Muse Wonder" /><AiTag model="Muse Spark" /></Row>
        </Card>
      </SquishIn>

      {BRIEFING.issues.map((iss, i) => <IssueCard key={iss.id} issue={iss} index={i + 1} mayApprove={mayApprove} />)}

      <Label>Wins</Label>
      {BRIEFING.wins.map((w, i) => (
        <SquishIn key={w.title} index={i}>
          <Card soft style={{ backgroundColor: color.mintSoft, gap: 2 }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 15, color: color.mintInk }}>{w.title}</Text>
            <Text style={{ fontFamily: font.body, fontSize: 13, color: color.mintInk }}>{w.detail}</Text>
          </Card>
        </SquishIn>
      ))}

      <Card style={{ gap: 12 }}>
        <H2 style={{ fontSize: 17 }}>Run Nightshift now</H2>
        <Sub style={{ fontSize: 14 }}>It runs by itself after closing. Run it now to include tonight so far.</Sub>
        {(run.running || run.done) && (
          <View style={{ gap: 8 }}>
            <WorkLine state={run.step >= 0 ? 'done' : 'wait'} text="Planning what to look at" model="Muse Wonder" />
            {ANALYSTS.map((a) => <WorkLine key={a} state={run.done ? 'done' : run.running ? 'run' : 'wait'} text={a} />)}
            <WorkLine state={run.done ? 'done' : 'wait'} text="Linking facts into causes" model="Muse Wonder" />
          </View>
        )}
        {run.done ? <Chip tone="mint" label="Same 2 issues. 1 new guest note added to the portion issue." /> : <Button small kind="saffron" title={run.running ? 'Running…' : 'Run now'} disabled={run.running} onPress={run.start} />}
      </Card>

      {role === 'owner' && <Button title="Ask Nomi a question" onPress={() => router.push('/ask')} />}
    </Screen>
  );
}
