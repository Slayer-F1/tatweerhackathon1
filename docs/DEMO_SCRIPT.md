# 2-minute demo / pitch script

For the demo video **and** the Sunday live final (criterion 8). Record screen + voiceover. Keep it under 2½ minutes.

## Before you record
- Deploy first; demo the **public URL** (not localhost).
- Have DevTools ready for the offline trick.
- One clean browser tab, language on English to start.

## Script (with on-screen actions)

**[0:00–0:20] The hook — the problem**
> "99% of people in the UAE can't see the Milky Way from home. But 90 minutes from Abu Dhabi is Al Qua'a — the darkest sky in the country — surrounded by camel-farming families whose income is volatile. The problem: you never know which night is actually worth the drive, and those families can't monetize the sky above them."

**[0:20–0:50] The core — live score** *(on Tonight tab)*
> "Najm scores tonight's stargazing from live data — no app install, no login. Right now it's [READ THE SCORE]: clear skies but a bright moon, so it's a 'good' night, dark from 8:40pm to 4am. Every input is real —"
*(click "Verify the live data" — show the raw Open-Meteo JSON)*
> "— that's the actual cloud forecast it's reading. The moon math runs in your browser."

**[0:50–1:15] Plan ahead — 7 nights** *(click 7 Nights)*
> "It scores the next seven nights so you pick the best one to travel. This one's flagged best. Tap a night to start a booking for it."

**[1:15–1:45] The impact — hosts** *(click Stay with a host)*
> "Here's the second half. Your trip becomes income for a local camel-farm family — not a 20%-cut global platform. Pick a host, request a night —"
*(open booking, fill, submit)*
> "— and it hands off straight to the host on WhatsApp. Dark-sky tourism did £25M a year for one rural region in the UK; this routes that value to Al Qua'a."

**[1:45–2:10] Built for the desert — bilingual + offline** *(toggle العربية, then DevTools offline + reload)*
> "Fully Arabic and right-to-left. And because Al Qua'a has no signal and no facilities — watch: I'll go offline… reload… and it still works. The conditions and moon times are right here, cached."

**[2:10–2:30] Close — feasibility & scale**
> "No backend, no API keys, near-zero cost — it runs free on GitHub Pages, perfect for a rural setting. And it's one config change to launch for any dark community on earth. That's Najm Al Qua'a."

## Q&A prep (criterion 8 — answering under questioning)
- **"Is the dark-sky rating real?"** → Honest: it's a sourced qualitative rating, not a live Bortle reading — no free no-key API exists; we'd add a field SQM measurement. (We *state* this in the README — that's the point of falsifiability.)
- **"Are the hosts real?"** → They're labelled samples; the booking path is real and hands off to the host. We deliberately didn't fake a transactional marketplace.
- **"What's your evidence anyone wants this?"** → The AP "darkest spot" coverage, the 99% Milky-Way stat, existing paid Al Qua'a tours (~AED 2,000/night), and our own community validation in README §9.
- **"How is this different from Clear Outside / a weather app?"** → It's place-based for Al Qua'a, fuses the score with a local host-income layer, is bilingual + offline for the desert, and is community-owned.
