# Demo images

Every photo a mock run of Nomi needs: Golden Plates for each dish, good and off-standard plates from the pass, guest phone
photos, shelves, the closing round and the printed menu. Generate them once, then Nomi runs real SAM 3.1 on each one, so the
masks, counts and positions the demo shows are what the model actually found.

```bash
npm run demo:media -w @nomi/models                  # make every missing image with Muse Image, then run SAM on it
npm run demo:media -w @nomi/models -- --only paneer  # just the files whose path contains "paneer"
npm run demo:media -w @nomi/models -- --sam-only     # images made elsewhere: drop them in place, run SAM only
```

Generating needs `MODEL_API_KEY` in `.env`. Running SAM also needs the API and the vision worker running (see the README).
Images land in `apps/app/assets/images/demo/<path>`, resized to 1280 px JPEG. Each gets a `.sam.json` next to it, and
`apps/app/src/lib/demo-media.ts` is rewritten so the app can use them.

You can also make the images in any other tool. Keep the file names, put them in place, then run with `--sam-only`.

## How to read an entry

Each entry has a heading with the file path, then:

- **Make:** `generate` makes a new image. `edit <path>` edits an image made earlier, so the plate, counter, camera and light
  stay identical and only the named change happens. Off-standard plates always edit their dish's golden photo.
- **Size:** `1536x1024` landscape (pass and kitchen), `1024x1536` portrait (guest phone, menu), or `1024x1024`.
- **Style:** which shared style block goes in front of the prompt (`none` for no block).
- **Shows:** what the app uses it for.
- **SAM parts:** `none` when SAM should skip the dish parts, or a list of part names to use only those. Otherwise the
  section's `parts` table applies: name, the plain noun SAM is asked for, the colour the app draws it in, and its role.
  Nouns were checked against the generated images: SAM finds "metal can" and "white sack" but not "tin" or "milk pouch". Pass and guest photos are also measured against the
  plate.
- The fenced `prompt` block is the prompt itself.

After generating, look at each image before trusting it: image models miscount. If a golden biryani shows 5 chicken pieces,
regenerate it. The count SAM finds is what the demo shows, so a miscount shows up as a wrong number, not a hidden one.

## Style blocks

```style pass
Photorealistic photo taken straight down from directly above, camera at exactly 90 degrees, by a tablet mounted over a
restaurant kitchen's plating pass. The plate sits in the middle of a brushed stainless steel counter with faint scratches.
Even, soft white LED light from above, no harsh shadows, no glare on the food. No hands, no people, no cutlery, no text, no
logos, no watermark. Sharp focus across the whole plate. Plain round white ceramic dinner plate, 27 cm, thin raised rim,
unless the prompt says a bowl. Indian restaurant food, realistic portions, appetising but not styled for an advert.
```

```style guest
Photorealistic smartphone photo taken by a diner at their table in a warm, busy North Indian restaurant at night, held at about
45 degrees above the plate. Dark wooden table, a steel water glass and a folded napkin at the edge of the frame, warm
yellow lighting, slight phone-camera grain. The whole plate is in frame. No faces, no hands, no text, no logos.
```

```style kitchen
Photorealistic photo of a small, clean, working Indian restaurant kitchen at closing time, taken at chest height with a
phone. Even white tube-light lighting, stainless steel and white tiles. No people, no faces, no hands, no readable brand
names or logos, no text except where the prompt asks for it.
```

```style print
Photorealistic photo of a printed restaurant menu card lying flat on a wooden table, taken from directly above with a
phone. The whole card is in frame with all four corners visible. Text is crisp and readable.
```

## Kitchen setup

### kitchen/calibration-empty-plate.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** Golden Plate step 1, calibrating the pass.
- **SAM parts:** none (plate only)

```prompt
One empty, clean plain round white dinner plate, perfectly centred on the counter. Nothing on it.
```

### kitchen/menu-printed.jpg

- **Make:** generate
- **Size:** 1024x1536
- **Style:** print
- **Shows:** Setup, Menu Snap. Muse Wonder reads it; two fields are deliberately hard to read so the review shows amber.

```prompt
A cream-coloured A4 menu card titled "Saffron House" in a simple serif font, with a small saffron-coloured line under the
title. Three sections with headings and prices in Indian rupees on the right:
Starters: Paneer Tikka ₹289, Hara Bhara Kebab ₹199.
Mains: Chicken Biryani ₹349, Mutton Biryani ₹449, Butter Chicken ₹379, Dal Makhani ₹259.
Breads and desserts: Garlic Naan ₹69, Gulab Jamun ₹129, Rasmalai (2 pc) ₹149.
A small green square next to veg dishes and a small red square next to non-veg dishes.
A round curry stain covers the price of Hara Bhara Kebab so it cannot be read. The bottom right corner is folded over,
hiding the first half of the word "Rasmalai".
```

## Chicken Biryani

The demo's main dish. Golden Plate v2 is published; tonight's dinner plates drift.

```parts
Rice | rice | #4D9DE0 | main
Chicken pieces | chicken pieces | #D93A2E | count
Fried onions | fried onions | #FFB627 | placement
Lemon wedge | lemon wedge | #FF7AB6 | placement
Raita bowl | bowl | #3BB273 | side
```

### chicken-biryani/golden-1.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** The Golden Plate everywhere: dish detail, plating card, the pass comparison.

```prompt
Chicken biryani. A neat, generous mound of long-grain saffron and white basmati rice covers the centre of the plate.
Exactly 4 pieces of red-brown masala chicken (two thighs, two drumsticks) sit evenly spaced on the rice. A small cluster
of crisp golden-brown fried onions at the 2 o'clock position on the rice. One lemon wedge resting on the plate rim at
5 o'clock. A few coriander leaves and two green cardamom pods on the rice. Off the plate, on the counter to the left at
9 o'clock, a small round green ceramic bowl of white cucumber raita with coriander.
```

### chicken-biryani/golden-2.jpg

- **Make:** edit chicken-biryani/golden-1.jpg
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** Golden Plate photo 2 of 3: same plating, plated again.

```prompt
The same dish plated again by the same chef: keep every component, count and position, but the chicken pieces sit at
slightly different angles, the rice mound edge is a little different, and the whole plate is rotated about 10 degrees
clockwise. Same camera, same counter, same light.
```

### chicken-biryani/golden-3.jpg

- **Make:** edit chicken-biryani/golden-1.jpg
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** Golden Plate photo 3 of 3.

```prompt
The same dish plated a third time: keep every component, count and position, but the plate sits about 3 cm lower in the
frame, the fried onions cluster is slightly smaller, and the lemon wedge is turned the other way on the rim. Same camera,
same counter, same light.
```

### chicken-biryani/pass-good.jpg

- **Make:** edit chicken-biryani/golden-1.jpg
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** The pass, a plate that matches (score in the 90s).

```prompt
The same dish plated during a busy service, still matching the standard: same 4 chicken pieces, same rice mound, onions at
2 o'clock, lemon on the rim. A few grains of rice have fallen onto the plate rim. Same camera, counter and light.
```

### chicken-biryani/pass-rice-short.jpg

- **Make:** edit chicken-biryani/golden-1.jpg
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** The pass, "Rice share 18% under reference". Capture cap-8.

```prompt
Change only the rice: the rice mound is clearly smaller, about a fifth less rice, so more white plate shows around it.
Keep the 4 chicken pieces, onions, lemon and raita bowl exactly as they are. Same camera, counter and light.
```

### chicken-biryani/pass-onions-missing.jpg

- **Make:** edit chicken-biryani/pass-rice-short.jpg
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** The pass amber nudge, "Rice share 21% under reference · Fried onions missing". Capture cap-9.

```prompt
Remove the fried onions completely, leaving plain rice where they were at 2 o'clock. Change nothing else.
```

### chicken-biryani/pass-three-pieces.jpg

- **Make:** edit chicken-biryani/golden-1.jpg
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** The pass, "3 chicken pieces, reference is 4". Capture cap-7.

```prompt
Remove one chicken drumstick, so exactly 3 chicken pieces remain, and fill its place with rice. Change nothing else.
```

### chicken-biryani/pass-lemon-off.jpg

- **Make:** edit chicken-biryani/golden-1.jpg
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** The pass, "Lemon off the rim". Capture cap-6.

```prompt
Move the lemon wedge off the rim and onto the middle of the rice, next to a chicken piece. Change nothing else.
```

### chicken-biryani/guest-table-7.jpg

- **Make:** generate
- **Size:** 1024x1536
- **Style:** guest
- **Shows:** Guest note fb-101 from Table 7, compared with the Golden Plate; "Show us your plate" recognition.

```prompt
A plate of chicken biryani on a plain round white plate, already served at the table: a smaller mound of saffron rice than
usual, exactly 3 red-brown masala chicken pieces, a few fried onions, a lemon wedge on the rim. A small green bowl of raita
beside the plate.
```

## Mutton Biryani

No Golden Plate yet: this is the dish the chef sets up live in the demo ("+ Add a Golden Plate"). Show these three on a
tablet or print them, and point Nomi's camera at them, or switch on the demo camera.

```parts
Rice | rice | #4D9DE0 | main
Mutton pieces | meat pieces | #8C3B2E | count
Fried onions | fried onions | #FFB627 | placement
Boiled egg | boiled egg | #FFF1A8 | placement
Raita bowl | bowl | #3BB273 | side
```

### mutton-biryani/golden-1.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** Golden Plate set-up, photo 1 of 3.

```prompt
Mutton biryani. A neat mound of long-grain saffron and white basmati rice covers the centre of the plate. Exactly 4 dark
brown pieces of bone-in mutton sit spread on the rice. A cluster of crisp fried onions at 2 o'clock. Half a boiled egg,
yolk up, at 7 o'clock on the rice. A few mint leaves scattered. Off the plate, on the counter at 9 o'clock, a small round
steel bowl of white raita.
```

### mutton-biryani/golden-2.jpg

- **Make:** edit mutton-biryani/golden-1.jpg
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** Golden Plate set-up, photo 2 of 3.

```prompt
The same dish plated again: same components, counts and positions, mutton pieces at slightly different angles, plate
rotated about 8 degrees anticlockwise. Same camera, counter and light.
```

### mutton-biryani/golden-3.jpg

- **Make:** edit mutton-biryani/golden-1.jpg
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** Golden Plate set-up, photo 3 of 3.

```prompt
The same dish plated a third time: same components, counts and positions, the plate sits slightly right of centre and the
egg half is turned a little. Same camera, counter and light.
```

### mutton-biryani/pass-egg-missing.jpg

- **Make:** edit mutton-biryani/golden-1.jpg
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** After publishing, the first check on the pass: "Boiled egg missing".

```prompt
Remove the half boiled egg completely, leaving rice where it was. Change nothing else.
```

## Paneer Tikka

```parts
Paneer cubes | paneer cubes | #F2A65A | count
Onion rings | onion rings | #C77DFF | placement
Mint chutney | green sauce | #3BB273 | side
Lemon wedge | lemon wedge | #FF7AB6 | placement
```

### paneer-tikka/golden-1.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** Golden Plate v1 for Paneer Tikka.

```prompt
Paneer tikka. Exactly 6 cubes of paneer with charred orange-red tandoori edges, arranged in a gentle curve across the
centre of the plate, with a few pieces of charred green capsicum and onion between them. A small heap of raw red onion
rings at 10 o'clock. A small round white dish of bright green mint chutney on the plate at 3 o'clock. One lemon wedge on
the rim at 6 o'clock. A pinch of chaat masala dusted over the paneer.
```

### paneer-tikka/pass-chutney-missing.jpg

- **Make:** edit paneer-tikka/golden-1.jpg
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** The pass, "Mint chutney missing". Capture cap-4.

```prompt
Remove the small dish of green mint chutney completely, leaving empty plate where it was. Change nothing else.
```

### paneer-tikka/guest-table-9.jpg

- **Make:** generate
- **Size:** 1024x1536
- **Style:** guest
- **Shows:** Guest note fb-106 from Table 9; "Show us your plate" recognition.

```prompt
A plate of paneer tikka served at the table: 6 charred paneer cubes with capsicum and onion, red onion rings, a small dish
of green mint chutney and a lemon wedge on a plain round white plate.
```

## Butter Chicken

```parts
Bowl | bowl | #4D9DE0 | main
Chicken pieces | chicken pieces | #D93A2E | count
Cream swirl | cream swirl | #FFF1A8 | placement
Coriander | coriander leaves | #3BB273 | placement
```

### butter-chicken/golden-1.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** Golden Plate v1 for Butter Chicken.

```prompt
Butter chicken served in a plain round white ceramic bowl, 18 cm, centred on the counter (no plate). Glossy orange
tomato-butter gravy fills the bowl. Exactly 5 pieces of tandoori chicken show above the gravy. A single white cream swirl
spirals in the centre. A small pinch of chopped coriander leaves at 12 o'clock near the rim.
```

### butter-chicken/pass-no-cream.jpg

- **Make:** edit butter-chicken/golden-1.jpg
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** The pass, "Cream swirl missing".

```prompt
Remove the white cream swirl completely so the gravy surface is plain orange in the centre. Change nothing else.
```

### butter-chicken/guest-table-2.jpg

- **Make:** generate
- **Size:** 1024x1536
- **Style:** guest
- **Shows:** A happy guest's photo (fb-105); "Show us your plate" recognition.

```prompt
A white bowl of butter chicken on the table with a basket of garlic naan beside it: glossy orange gravy, pieces of chicken,
a cream swirl and coriander on top.
```

## Dal Makhani

```parts
Bowl | bowl | #4D9DE0 | main
Cream drizzle | cream drizzle | #FFF1A8 | placement
Butter cube | butter | #FFB627 | placement
Coriander | coriander leaves | #3BB273 | placement
```

### dal-makhani/golden-1.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** Golden Plate v1 for Dal Makhani.

```prompt
Dal makhani served in a plain round white ceramic bowl, 16 cm, centred on the counter (no plate). Thick, glossy, very dark
brown-black lentil curry fills the bowl. A spiral drizzle of white cream in the centre. One small square cube of yellow
butter melting at 1 o'clock. A pinch of chopped coriander at 7 o'clock.
```

### dal-makhani/pass-no-butter.jpg

- **Make:** edit dal-makhani/golden-1.jpg
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** The pass, "Butter cube missing".

```prompt
Remove the cube of butter completely. Change nothing else.
```

## Garlic Naan

Golden Plate is a draft: photographed, not yet published.

```parts
Naan pieces | flatbread | #FFB627 | count
Butter | butter | #FFF1A8 | placement
Coriander | coriander leaves | #3BB273 | placement
```

### garlic-naan/golden-1.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** The Garlic Naan draft.

```prompt
One large garlic naan, cut into exactly 4 pieces and laid slightly apart on the plate, golden with charred brown blisters,
brushed with butter, flecked with chopped garlic and coriander. A small pat of butter in the centre where the pieces meet.
```

## Gulab Jamun

No Golden Plate yet.

```parts
Bowl | bowl | #4D9DE0 | main
Gulab jamun | brown balls | #8C3B2E | count
Pistachio | pistachio | #3BB273 | placement
```

### gulab-jamun/golden-1.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** pass
- **Shows:** Dish card and plating card for Gulab Jamun.

```prompt
Gulab jamun served in a small plain round white ceramic bowl, centred on the counter (no plate). Exactly 2 glossy
dark-brown gulab jamun balls sitting in light golden sugar syrup. A few slivers of green pistachio on top of each ball.
```

## Larder

Shelf scans: SAM counts whole items, and the Larder screen shows those counts. Check them after generating.

```parts
Rice sacks | white sack | #FFB627 | count
Oil tins | metal can | #4D9DE0 | count
Atta bags | paper bag | #F2A65A | count
Containers | plastic container | #3BB273 | count
Crates | crate | #C77DFF | count
```

### larder/dry-store.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** kitchen
- **Shows:** Larder shelf scan: "1 sack · 4 tins counted".
- **SAM parts:** Rice sacks, Oil tins, Atta bags

```prompt
A dry store room with two plain steel wire shelves seen straight on. Bottom shelf: exactly 1 large white woven
polypropylene sack of basmati rice, and exactly 2 brown paper bags of wheat flour. Top shelf: exactly 4 identical square
silver 15-litre cooking oil tins in a row, with plain unbranded labels. Plenty of empty space on the shelves. Plain white
tiled wall behind.
```

### larder/walk-in.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** kitchen
- **Shows:** Larder shelf scan of the walk-in fridge: "8 packets counted".
- **SAM parts:** Containers, Crates

```prompt
Inside a restaurant walk-in fridge, one steel shelf seen straight on. Exactly 8 plain white 1-litre milk pouches lying in a
single row in a blue plastic crate. Next to it, exactly 3 clear plastic food containers with blue lids, stacked. Cold white
light, a little condensation on the steel.
```

## Closing round

The same 6 spots every night. Nomi reports only visible things: counts and flags such as a container without a lid. "After"
photos edit the flagged photo so the fix is the only difference.

```parts
Containers | container | #4D9DE0 | count
Lids | lid | #3BB273 | count
Knives | knife | #C77DFF | count
Cutting boards | cutting board | #F2A65A | count
Onion tray | tray | #FFB627 | placement
Pots | pot | #8C3B2E | count
Spill | spill | #D93A2E | placement
Bins | bin | #4D9DE0 | count
```

### closing/walkin-no-lid.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** kitchen
- **Shows:** Closing, walk-in fridge: "Container without a lid · Top shelf, left".
- **SAM parts:** Containers, Lids

```prompt
Inside a walk-in fridge, two steel shelves seen straight on. Top shelf: 4 clear plastic food containers in a row; the
leftmost one has no lid and shows chopped onions inside, the other 3 have blue lids. Bottom shelf: 3 more lidded
containers.
```

### closing/walkin-fixed.jpg

- **Make:** edit closing/walkin-no-lid.jpg
- **Size:** 1536x1024
- **Style:** kitchen
- **Shows:** The after photo for the lid flag.
- **SAM parts:** Containers, Lids

```prompt
Put a matching blue lid on the leftmost container on the top shelf. Change nothing else.
```

### closing/prep-counter.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** kitchen
- **Shows:** Closing, prep counter: "Item left out · Onion tray on the counter".
- **SAM parts:** Knives, Cutting boards, Onion tray

```prompt
A long stainless steel prep counter, wiped clean, seen at chest height. On the wall above, a magnetic strip holding exactly
6 kitchen knives. Exactly 3 white plastic cutting boards standing upright in a rack at the right end. Left out on the
counter at the left end: one steel tray of sliced red onions, uncovered.
```

### closing/prep-counter-fixed.jpg

- **Make:** edit closing/prep-counter.jpg
- **Size:** 1536x1024
- **Style:** kitchen
- **Shows:** The after photo for the onion tray flag.
- **SAM parts:** Knives, Cutting boards, Onion tray

```prompt
Remove the tray of sliced onions from the counter, leaving clean steel. Change nothing else.
```

### closing/stove.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** kitchen
- **Shows:** Closing, stove and tandoor: "Handis: 4", nothing flagged.
- **SAM parts:** Pots

```prompt
A row of commercial gas burners, all switched off and clean, with exactly 4 empty steel handi cooking pots lined up on
them, lids on. A clay tandoor oven with its lid closed at the right end.
```

### closing/floor-spill.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** kitchen
- **Shows:** Closing, floor and drain: "Spill · Near the drain, left".
- **SAM parts:** Spill

```prompt
A grey anti-slip tiled kitchen floor seen from standing height, with a square steel floor drain in the middle. A small
puddle of spilled yellow dal on the tiles just left of the drain. The rest of the floor is clean and dry.
```

### closing/floor-fixed.jpg

- **Make:** edit closing/floor-spill.jpg
- **Size:** 1536x1024
- **Style:** kitchen
- **Shows:** The after photo for the spill flag.
- **SAM parts:** Spill

```prompt
Remove the spill completely so the tiles left of the drain are clean and dry, still slightly shiny from mopping. Change
nothing else.
```

### closing/bins.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** kitchen
- **Shows:** Closing, bins: "Bins with lids closed: 3".
- **SAM parts:** Bins

```prompt
Exactly 3 tall plastic kitchen bins standing in a row against a white tiled wall, colours green, blue and black, all with
their lids fully closed. Clean floor around them.
```

## Studio

### studio/dining-room.jpg

- **Make:** generate
- **Size:** 1536x1024
- **Style:** none
- **Shows:** Studio: the dining room photo the table tents are styled from.

```prompt
Photorealistic photo of the dining room of a small, warm North Indian restaurant, empty before dinner service: dark wooden
tables with saffron-yellow napkins, brass pendant lamps, terracotta and deep-blue walls with block-print patterns, a small
folded card table tent on each table. Shot from the entrance at eye level. No people, no readable text or logos.
```
