# Changelog

## 0.9.3 — 2026-11-26

- **Fixed on Windows:** LUNA on Windows sizes the page to the window's outer size, title bar and frame included, so the bottom 39 px and the right 16 px were hidden. The page now leaves that space out on Windows, so everything at the bottom and right edges shows in full.
  the part you can see, so the controls at the bottom were hidden. The page now fits itself to
  the window size LUNA reports; nothing changes where the two match.
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
