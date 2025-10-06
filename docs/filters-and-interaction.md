# Filters & Interaction

## Filters

State shape:

- `parties: string[]` empty => all
- `genders: string[]` empty => all
- `minAge` / `maxAge` numbers or null

`apply()` centralizes logic; empty arrays collapse back to "all" when everything is re-selected.

## Interaction Model

- Arrow keys: seat navigation (wraps & ring proportional)
- Home/End: first/last seat
- Page Up/Down: ±10 seats
- Space/Enter: toggle lock (aria-pressed)
- Tooltip mode persisted under `parliamentTooltipMode`

Live region announces seat focus and lock/unlock events for screen readers.
