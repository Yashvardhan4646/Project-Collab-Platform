# Collab Platform — Design Brief

A handoff for the designer. This lists **what the product is**, **every screen and state that needs a design**, and **the design-system pieces to hand back** so it drops straight into code. No code decisions needed from you — just design.

The app is fully built and works. What it lacks is a visual identity: it's functional but bare. Everything below already exists in the product; you're skinning it, not inventing features.

---

## 1. What Collab is

One workspace for a **small team** (student teams, tiny startups) to chat, track tasks, keep notes, and hop on a call — instead of juggling Discord + Trello + Google Docs + Zoom. Think "Discord's shape, but the task board is the point."

- **Audience:** small teams of ~3–10 who want one tool, not five tabs.
- **Feel we're after:** focused, calm, a bit sharp. A tool you work in all day.
- **The star feature is the task board** — give it the most polish. It's the reason to pick this over Discord.

### ⚠️ Color direction
- **Do NOT use dark indigo / blurple.** The current build leans on `#4f46e5` indigo (the Discord-ish default) everywhere — that's exactly what we're moving away from. Pick a fresh accent that isn't indigo/purple/Discord-blue.
- Everything else about the palette is open. Pick the accent, the surfaces, the whole thing.

---

## 2. The shape of the app (the frame every screen sits in)

Three vertical columns, left to right:

```
┌──────┬────────────┬───────────────────────────────┐
│ Rail │  Channel   │           Main area            │
│ 72px │  column    │        (the active view)       │
│      │  220px     │                                │
│ icons│  channels  │  chat / task board / notes /   │
│ for  │  in this   │  whiteboard / call / docs …    │
│ teams│  team      │                                │
│ + DM │            │                                │
│ + me │            │                                │
└──────┴────────────┴───────────────────────────────┘
```

- **Rail (72px):** vertical strip of round icons — Desk (home), Direct Messages, one square per team, "+ new team", your private cubicle, and your avatar + logout at the bottom. Discord's server rail, essentially.
- **Channel column (220px):** the current team's name + invite button at top, then its list of channels (each has a type icon), then "+ add channel".
- **Main area:** whatever's open — a chat, the task board, notes, etc.

Currently **dark-only**. Decide if you want a light mode too (nice-to-have, not required).

---

## 3. Screens & surfaces to design

Grouped. For each: what it's for, what's on it, and the states it needs.

### A. Getting in
1. **Landing page** (public, logged-out marketing page) — hero headline, sub, "Get started" CTA, a "start at your desk" callout card, a grid of ~9 feature cards, closing CTA, footer. Needs: hero styling, feature-card style, CTA buttons.
2. **Login** — email sign-in (magic link / OAuth). Small, centered. Needs: the auth card.
3. **Onboarding** — new user picks a display name + claims a unique **@username**. Needs: form + "username taken/available" feedback states.
4. **Join by invite** (`/join/<code>`) — someone opened an invite link; confirm-and-join screen. States: valid invite, expired/invalid, already a member.

### B. The Desk (home dashboard — the first thing you see after login)
Three stacked sections, centered column:
- **"Waiting on you"** — list of tasks assigned to you across all teams, each with a due label (`due in 3h`, `2d overdue`). Overdue ones read as urgent. Empty state: "Nothing is blocked on you. Clean slate."
- **"Your teams"** — grid of team cards (avatar, name, member count, open-task count, Open button, unread badge). Empty state: "not in any teams yet."
- **"Direct messages"** — list with an all / unread filter toggle. Empty state.

Needs: section-header style, the **task-waiting row**, the **team card**, the **DM row**, empty states, the unread **badge**, and the overdue/urgent treatment.

### C. App shell
5. **Rail** — round icon buttons (44px), active vs idle vs hover states, unread dot on a team, red count badge on DMs, the "+" new-team button, avatar + "Log out" footer. Needs: the icon-button system + active/unread indicators.
6. **Channel column** — team header, **invite** button + the invite-link popover (with a copy-to-clipboard state), channel rows (type icon + name, active/idle/hover, delete-on-hover ×), and the **"add channel"** inline form (name field + a type dropdown). Needs: list-row states, the popover, the inline create form.
7. **Channel type icons** — there are 8 channel types (text, voice/video, whiteboard, tasks, notes, reminders, docs, cubicle). They're currently **emoji/unicode** (`#`, `🔊`, `▧`, `☑`, `≡`, `⏰`, `▤`, `◻`) which look inconsistent. **Please design or pick a real icon set** — one coherent family for these 8 + the rail glyphs (desk, DM, settings).

### D. The channels (main-area views)
8. **Text chat** ⭐ (used a lot) — header (channel name + "N here" presence), message list (avatar + name + time + text/image, "(edited)" tag, hover edit/delete on your own), "load older" button, a **typing indicator**, an image-attach chip, and the composer (input + attach + send). States: empty ("No messages yet"), someone typing, image preview before send. Needs: **message row** design, composer, typing indicator.
9. **Task board** ⭐⭐ **(the USP — most polish here)** — three columns **To do / In progress / Done**, each with a colored dot + count. Task cards show title, assignee avatar (or a "claim" chip if unassigned), a due label (overdue = urgent), and move ←/→ + delete controls. Top bar has the "add task" row (title + assignee dropdown + date picker + Add). States: loading, empty column, a done task (struck through), overdue. **This is the screen that sells the product — make it feel great.** Consider how drag-and-drop *could* look even though today it's arrow buttons.
10. **Notes** — a shared note that saves as you type, live for everyone. Mostly a big text surface. Needs: the editor surface + a subtle "saved" indicator.
11. **Reminders** — a running checklist with due times. Needs: checklist item (checkbox, text, due time, done state).
12. **Whiteboard** — a live shared canvas; you see other people's cursors. Needs: the canvas frame, a small tool strip, remote-cursor labels.
13. **Voice / video** — one-click peer-to-peer call in the browser. Needs: pre-join state, in-call tiles (video/avatar), mute/camera/leave controls.
14. **Embedded docs** — paste a Google Doc/Sheet/Slides link and it embeds in the channel. Needs: the "paste a link" empty state + the embed frame/header.
15. **Private cubicle** — a space only you can see, for personal notes/drafts. Reuses the above surfaces; just needs a clear "this is private to you" signal.

### E. People & settings
16. **DM panel** — slides out beside the rail (300px): list of conversations, a "new message" flow that finds people in your teams **or** DMs anyone by exact @username (with a "no one with that handle" error state). Needs: the panel, conversation rows, the people-picker, the @username lookup + error.
17. **DM chat** — same as text chat but 1:1 (no channel #).
18. **Members** — a team's member list (avatar, name, @username, role). Needs: the member row + role tag.
19. **Profile settings** — edit display name, @username, avatar upload. Needs: the settings form layout + avatar uploader.

### F. Global pieces (used everywhere — design once)
20. **Buttons** — primary / secondary / ghost / danger, plus disabled and busy ("…") states.
21. **Inputs** — text, textarea, select, date picker, read-only (invite link). Focus + error states.
22. **Modals / dialogs** — ⚠️ the app currently uses the browser's native `alert()` / `confirm()` / `prompt()` for "new team name", "delete this channel?", and errors. These are ugly and off-brand. **Please design:** a small **input dialog**, a **confirm/destructive dialog**, and a **toast** (for errors + "copied!"). This is a real gap.
23. **Badges & counts** — unread count pill, "N open" counts, the overdue treatment.
24. **Avatars** — image + initials fallback (used at ~18/32/34/40px). Define the initials style + fallback background.
25. **Empty states** — desk sections, empty channels, no DMs, empty task columns. A consistent, friendly pattern.

---

## 4. What to hand back (so it maps cleanly to code)

The app is token-driven under the hood, so the cleaner the system you give, the faster it ships. Ideal deliverables:

**Color**
- **Surface ramp:** ~4 steps — app background → raised panel → card → border/divider. (Today it's an inconsistent sprawl of `#0a0a0a`, `#0f0f0f`, `#111`, `#141414`, `#191919`, `#222`, `#262626`, `#333` — collapse it to a clean ramp.)
- **Text:** high / mid / faint (3 steps), + a "disabled" grey.
- **Accent:** base + hover + active/pressed + a soft "accent-tinted background" (for active rows). **Not indigo.**
- **Semantic:** success (done), warning (due soon), danger (overdue / delete), maybe info.
- One coherent set. Right now there are *three* different accent blues and a stray orange in the loader — one accent, please.

**The rest of the system**
- **Type scale** — sizes + weights for: page title, section header, card title, body, small/meta, tiny (11px labels). Font is currently Geist; keep it or propose one.
- **Spacing scale** (4/8/12/16…), **corner radii** (buttons vs cards vs pills vs avatars), and **shadows/elevation** if any.
- **Component specs** for the globals in §3F (buttons, inputs, cards, badges, avatars, dialogs, toasts).
- **The channel-type icon set** (8 types + rail glyphs).
- Whether there's a **light mode**.

**Format:** Figma is ideal (I can pull tokens + specs from it). A styled mockup or even an annotated screenshot works too — whatever's fastest for you. The single most useful first thing is the **color ramp + accent + the task board**, since that unblocks the most.

---

## 5. Priority order (if you want a sequence)

1. **Color system + accent** (unblocks everything)
2. **Task board** (the USP — highest polish)
3. **App shell** (rail + channel column) + **buttons/inputs/dialogs**
4. **Chat** + **Desk**
5. Everything else (other channel types, settings, empty states)

---

*Once you send designs back — Figma, mockups, or just the token values — hand them to me and I'll wire them in.*
