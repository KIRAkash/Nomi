// One guest visit: what they picked, rated, answered and said, held until they press send.
import type { GuestPage } from '@nomi/shared';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type Visit = {
  token: string;
  page: GuestPage;
  picked: string[];
  ratings: Record<string, 1 | 2 | 3 | 4 | 5>;
  answers: Record<string, 'yes' | 'no'>;
  voiceUri: string | null;
  photoDishId: string | null;
  text: string;
};

type Store = Visit & {
  toggle: (dishId: string) => void;
  setPicked: (ids: string[]) => void;
  rate: (dishId: string, value: 1 | 2 | 3 | 4 | 5) => void;
  answer: (questionId: string, value: 'yes' | 'no') => void;
  setVoice: (uri: string | null) => void;
  setPhotoDish: (dishId: string | null) => void;
  setText: (t: string) => void;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);
const BLANK: Omit<Visit, 'token' | 'page'> = { picked: [], ratings: {}, answers: {}, voiceUri: null, photoDishId: null, text: '' };

export function GuestProvider({ token, page, children }: { token: string; page: GuestPage; children: ReactNode }) {
  const [v, setV] = useState(BLANK);
  const store = useMemo<Store>(() => ({
    token, page, ...v,
    toggle: (id) => setV((s) => ({ ...s, picked: s.picked.includes(id) ? s.picked.filter((x) => x !== id) : [...s.picked, id] })),
    setPicked: (ids) => setV((s) => ({ ...s, picked: ids })),
    rate: (id, value) => setV((s) => ({ ...s, ratings: { ...s.ratings, [id]: value } })),
    answer: (q, value) => setV((s) => ({ ...s, answers: { ...s.answers, [q]: value } })),
    setVoice: (uri) => setV((s) => ({ ...s, voiceUri: uri })),
    setPhotoDish: (id) => setV((s) => ({ ...s, photoDishId: id, picked: id && !s.picked.includes(id) ? [...s.picked, id] : s.picked })),
    setText: (t) => setV((s) => ({ ...s, text: t })),
    reset: () => setV(BLANK),
  }), [token, page, v]);
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useGuest() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useGuest outside GuestProvider');
  return s;
}
