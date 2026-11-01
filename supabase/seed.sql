-- Demo restaurant for local development and the hackathon video. Table 7's QR token is "demo-table-7".
insert into restaurants (id, name, cuisine, city) values
  ('00000000-0000-0000-0000-00000000a001', 'Saffron House', 'North Indian', 'Bengaluru');

insert into tables (restaurant_id, label, qr_token) values
  ('00000000-0000-0000-0000-00000000a001', 'Table 7', 'demo-table-7'),
  ('00000000-0000-0000-0000-00000000a001', 'Table 3', 'demo-table-3');

insert into shifts (restaurant_id, name, start_time, end_time) values
  ('00000000-0000-0000-0000-00000000a001', 'Lunch', '12:00', '15:30'),
  ('00000000-0000-0000-0000-00000000a001', 'Dinner', '19:00', '23:30');

insert into dishes (id, restaurant_id, name, category, description, veg, components, guest_questions) values
  ('00000000-0000-0000-0000-0000000d0001', '00000000-0000-0000-0000-00000000a001', 'Chicken Biryani', 'Mains',
   'Long-grain rice, slow-cooked chicken, fried onion, raita, lemon.', false,
   '[{"name":"Rice","sam_prompt":"rice","role":"main"},{"name":"Chicken pieces","sam_prompt":"chicken pieces","role":"count"},{"name":"Fried onion garnish","sam_prompt":"fried onion garnish","role":"placement"},{"name":"Raita bowl","sam_prompt":"raita bowl","role":"side"},{"name":"Lemon wedge","sam_prompt":"lemon wedge","role":"placement"}]',
   '[{"id":"q-biryani-portion","text":"Was the portion enough?","yes_label":"Yes","no_label":"Too little","checks":"rice 38–46% of plate"},{"id":"q-biryani-pieces","text":"Enough chicken pieces?","yes_label":"Yes","no_label":"Fewer","checks":"4 pieces"},{"id":"q-biryani-hot","text":"Was it hot?","yes_label":"Hot","no_label":"Lukewarm","checks":"temperature"}]'),
  ('00000000-0000-0000-0000-0000000d0002', '00000000-0000-0000-0000-00000000a001', 'Paneer Tikka', 'Starters',
   'Chargrilled paneer cubes with peppers and mint chutney.', true,
   '[{"name":"Paneer cubes","sam_prompt":"paneer cubes","role":"count"},{"name":"Mint chutney","sam_prompt":"green chutney","role":"side"}]',
   '[{"id":"q-paneer-pieces","text":"Enough paneer pieces?","yes_label":"Yes","no_label":"Fewer","checks":"6 pieces"},{"id":"q-paneer-char","text":"Nicely charred?","yes_label":"Just right","no_label":"Burnt","checks":"presentation"},{"id":"q-paneer-hot","text":"Was it hot?","yes_label":"Hot","no_label":"Lukewarm","checks":"temperature"}]'),
  ('00000000-0000-0000-0000-0000000d0003', '00000000-0000-0000-0000-00000000a001', 'Dal Makhani', 'Mains', 'Black lentils slow-cooked with butter and cream.', true, '[]', '[]'),
  ('00000000-0000-0000-0000-0000000d0004', '00000000-0000-0000-0000-00000000a001', 'Butter Chicken', 'Mains', 'Tandoori chicken in a tomato and butter gravy.', false, '[]', '[]'),
  ('00000000-0000-0000-0000-0000000d0005', '00000000-0000-0000-0000-00000000a001', 'Garlic Naan', 'Breads', 'Tandoor bread with garlic and coriander.', true, '[]', '[]'),
  ('00000000-0000-0000-0000-0000000d0006', '00000000-0000-0000-0000-00000000a001', 'Gulab Jamun', 'Desserts', 'Milk dumplings in rose syrup.', true, '[]', '[]');

insert into stock_items (restaurant_id, name, sam_prompt, unit, min_level) values
  ('00000000-0000-0000-0000-00000000a001', 'Basmati rice', 'rice sack', 'sack', 4),
  ('00000000-0000-0000-0000-00000000a001', 'Cooking oil', 'oil tin', 'tin', 3),
  ('00000000-0000-0000-0000-00000000a001', 'Milk', 'milk packet', 'packet', 10);
