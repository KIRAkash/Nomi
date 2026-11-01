import { Card, H1, Screen, Sub } from '@nomi/ui';

/** A tab whose slice is not built yet: says what it will do and when, nothing more. */
export function NextSlice({ title, what, when }: { title: string; what: string; when: string }) {
  return (
    <Screen style={{ paddingBottom: 120 }}>
      <H1>{title}</H1>
      <Card soft style={{ gap: 6 }}>
        <Sub style={{ color: '#1B1B3A' }}>{what}</Sub>
        <Sub style={{ fontSize: 13 }}>Planned: {when}</Sub>
      </Card>
    </Screen>
  );
}
