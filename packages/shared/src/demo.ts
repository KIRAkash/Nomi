// Mirrors supabase/seed.sql: the app renders it before the API is running, and the API serves it when no database is set.
import type { GuestPage } from './types';

export const DEMO_GUEST_PAGE: GuestPage = {
  restaurant: { id: '00000000-0000-0000-0000-00000000a001', name: 'Saffron House', logo_url: null },
  table: { id: 'demo-table-7', label: 'Table 7' },
  shift: 'Dinner',
  dishes: [
    {
      id: '00000000-0000-0000-0000-0000000d0001', name: 'Chicken Biryani', category: 'Mains', icon_url: null,
      guest_questions: [
        { id: 'q-biryani-portion', text: 'Was the portion enough?', yes_label: 'Yes', no_label: 'Too little', checks: 'rice 38–46% of plate' },
        { id: 'q-biryani-pieces', text: 'Enough chicken pieces?', yes_label: 'Yes', no_label: 'Fewer', checks: '4 pieces' },
        { id: 'q-biryani-hot', text: 'Was it hot?', yes_label: 'Hot', no_label: 'Lukewarm', checks: 'temperature' },
      ],
    },
    {
      id: '00000000-0000-0000-0000-0000000d0002', name: 'Paneer Tikka', category: 'Starters', icon_url: null,
      guest_questions: [
        { id: 'q-paneer-pieces', text: 'Enough paneer pieces?', yes_label: 'Yes', no_label: 'Fewer', checks: '6 pieces' },
        { id: 'q-paneer-char', text: 'Nicely charred?', yes_label: 'Just right', no_label: 'Burnt', checks: 'presentation' },
        { id: 'q-paneer-hot', text: 'Was it hot?', yes_label: 'Hot', no_label: 'Lukewarm', checks: 'temperature' },
      ],
    },
    {
      id: '00000000-0000-0000-0000-0000000d0008', name: 'Tandoori Prawns', category: 'Starters', icon_url: null,
      guest_questions: [
        { id: 'q-prawns-count', text: 'Enough prawns?', yes_label: 'Yes', no_label: 'Fewer', checks: '5 prawns' },
        { id: 'q-prawns-juicy', text: 'Juicy, not dry?', yes_label: 'Juicy', no_label: 'Dry', checks: 'taste' },
      ],
    },
    {
      id: '00000000-0000-0000-0000-0000000d0010', name: 'Burrata Mango Chaat', category: 'Starters', icon_url: null,
      guest_questions: [{ id: 'q-burrata-fresh', text: 'Was the burrata fresh?', yes_label: 'Yes', no_label: 'Not really', checks: 'burrata' }],
    },
    {
      id: '00000000-0000-0000-0000-0000000d0009', name: 'Lamb Shank Rogan Josh', category: 'Mains', icon_url: null,
      guest_questions: [
        { id: 'q-lamb-tender', text: 'Did the lamb fall off the bone?', yes_label: 'Yes', no_label: 'Tough', checks: 'taste' },
        { id: 'q-lamb-rice', text: 'Saffron rice on the plate?', yes_label: 'Yes', no_label: 'Missing', checks: 'saffron rice at 9 o\'clock' },
      ],
    },
    { id: '00000000-0000-0000-0000-0000000d0003', name: 'Dal Makhani', category: 'Mains', icon_url: null, guest_questions: [] },
    { id: '00000000-0000-0000-0000-0000000d0004', name: 'Butter Chicken', category: 'Mains', icon_url: null, guest_questions: [] },
    { id: '00000000-0000-0000-0000-0000000d0005', name: 'Garlic Naan', category: 'Breads', icon_url: null, guest_questions: [] },
    { id: '00000000-0000-0000-0000-0000000d0006', name: 'Gulab Jamun', category: 'Desserts', icon_url: null, guest_questions: [] },
    {
      id: '00000000-0000-0000-0000-0000000d0011', name: 'Kesar Pista Kulfi', category: 'Desserts', icon_url: null,
      guest_questions: [{ id: 'q-kulfi-set', text: 'Was the kulfi firm?', yes_label: 'Yes', no_label: 'Melting', checks: 'temperature' }],
    },
    { id: '00000000-0000-0000-0000-0000000d0007', name: 'Mutton Biryani', category: 'Mains', icon_url: null, guest_questions: [] },
  ],
};
