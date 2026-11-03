# Nomi demo photos

Photos a judge can open on a laptop and point the Nomi app at, so every camera screen runs on a real photo with live
Meta models. Every photo here was made by Muse Image. The menu and the logo are the demo restaurant, Saffron House.

**Easiest:** open `index.html` in a browser and go full screen. Arrow keys step through 20 photos, and each one says which
screen to open in the app and what Nomi should find.

**In the app:** tap your avatar (top right), turn **Demo camera off** so the phone's real camera is used, and pick a role.
Hold the phone over the laptop screen as if it were the plate. Glare from the screen can lower the photo check; tilt the
laptop slightly if the photo check complains.

| Folder | Use it in | What happens |
| --- | --- | --- |
| `menu/` | Head Chef → Dishes → Snap a new menu | Muse Wonder types up the menu; unreadable fields come back amber |
| `golden-plates/` | Kitchen staff → Check my plate, or Head Chef → a dish without a Golden Plate | SAM 3.1 finds every part |
| `off-standard/` | Kitchen staff → Check my plate | Nomi names what is wrong: a piece short, a part missing |
| `guest-photos/` | Guest page → Show us your plate | Muse Spark names the dish |
| `kitchen/` | Manager → Larder → Photograph the shelves | SAM 3.1 counts whole items |

No laptop? Turn **Demo camera on** instead: every camera plays these same photos, and the calls to the models are still live.
Every screen with a mic also has **No mic? Play a sample voice note**, which sends a recorded Hindi or English clip through
Muse Voice Transcribe.
