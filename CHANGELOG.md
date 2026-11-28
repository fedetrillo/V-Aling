# Changelog

## 0.10.0 — 2026-11-28

- **New method: Warp (now the default).** Instead of cutting the double into pieces, V-Align puts LUNA warp markers on the same clip: each point where the double drifts is pinned to where it belongs and LUNA stretches between them. No cuts, no crossfades, nothing to consolidate, and far fewer edits. Uses LUNA Builder SDK 3.1.2 Update 1.
- **Warp or Pieces:** Warp sounds natural on small offsets (up to about 50 ms); when it has to move a lot, the stretching shows. The window warns you when the measured offset is large and Warp is chosen, and the guide has a step that explains when to use each method.
- The previous method stays as **Pieces**, in the new Method switch at the bottom. Consolidate only shows with Pieces, where it is still useful.
- **Report:** a Copy report button in the result box, and the report no longer fails silently inside LUNA. A notice in the middle of the window says it was copied.
- The guide's buttons no longer spill out of their box in some languages.

## 0.9.3 — 2026-11-26

- **Fixed on Windows:** LUNA on Windows sizes the page to the window's outer size, title bar and frame included, so the bottom 39 px and the right 16 px were hidden. The page now leaves that space out on Windows, so everything at the bottom and right edges shows in full.
- **Report copy:** Alt-click on the version now always says in the status bar that the report was copied. Where the system clipboard is blocked (seen on some Windows set-ups) it uses a fallback, and if that fails too it shows the report selected so you can copy it by hand.

## 0.9.2 (beta) — 2026-11-26

- New name: **V-Align**.

## 0.9.1 (beta) — 2026-11-26

- A progress bar with the step it is on and the time left.
- When it finishes: a short sound and a notice with the result and how long it took.

## 0.9.0 (beta) — 2026-11-26

- First public beta. Aligns doubles and backing vocals to the lead piece by piece with LUNA's
  own time-stretch, and crossfades every join.
- Saves the double unedited in a new version (V2) before touching it; **Back to original**
  makes that version active again.
- **Consolidate** (on by default) leaves the aligned double as a single clip.
- Before and after view with zoom, Strength and Precision (Tight, Normal, Natural).
- Dark and grey themes, seven colours, 7 languages, getting-started guide.
- Alt-click the version number to copy a report to send us.
