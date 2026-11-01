// Row types for the tables in supabase/migrations, kept by hand in step with the SQL.

export type Role = 'owner' | 'head_chef' | 'manager' | 'staff';

export type Restaurant = {
  id: string;
  name: string;
  cuisine: string | null;
  city: string | null;
  timezone: string;
  brand_kit: { logo_url?: string; colours?: string[]; style_prompt?: string } | null;
};

export type Dish = {
  id: string;
  restaurant_id: string;
  name: string;
  category: string | null;
  price: number | null;
  description: string | null;
  components: { name: string; sam_prompt: string; role: 'main' | 'count' | 'placement' | 'side' }[];
  icon_url: string | null;
  guest_questions: { id: string; text: string; yes_label: string; no_label: string; checks: string }[];
  active: boolean;
};

// Per component, averaged over the 3 golden photos with a tolerance from their spread
export type ComponentSignature = {
  name: string;
  present: boolean;
  area_share: number;
  angle_deg: number; // clock angle, 0 = 12 o'clock
  radius: number; // distance from plate centre, 0..1 of plate radius
  count: number | null;
  tolerance: { area_share: number; angle_deg: number; radius: number };
};

export type GoldenPlate = {
  id: string;
  dish_id: string;
  version: number;
  photos: string[];
  signature: ComponentSignature[];
  rules: { text: string; component: string; check: string; value: string | null }[];
  status: 'draft' | 'published';
  created_by: string;
  published_at: string | null;
};

export type GuestTable = { id: string; restaurant_id: string; label: string; qr_token: string; active: boolean };

// What the guest page needs, returned by GET /t/:token
export type GuestPage = {
  restaurant: Pick<Restaurant, 'id' | 'name'> & { logo_url: string | null };
  table: Pick<GuestTable, 'id' | 'label'>;
  shift: string | null;
  dishes: Pick<Dish, 'id' | 'name' | 'category' | 'icon_url' | 'guest_questions'>[];
};

export type GuestFeedbackInput = {
  dish_ids: string[];
  ratings: Record<string, 1 | 2 | 3 | 4 | 5>; // per dish, or "overall"
  answers: Record<string, 'yes' | 'no'>; // question id → answer
  text?: string;
  audio_upload_id?: string;
  photo_upload_id?: string;
  language?: string;
};
