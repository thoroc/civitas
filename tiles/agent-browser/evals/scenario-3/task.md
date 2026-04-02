# Theme Toggle Verification

## Problem Description

A recent pull request added a dark/light mode toggle to the local app. Before the PR is merged, the developer wants a script
to confirm that clicking the toggle actually changes the page's accessible structure — not just the visual styling.

Write a shell script `verify-toggle.sh` that opens the app, interacts with the theme toggle, and produces a report (`toggle-diff.txt`)
showing what changed in the page's structure after the toggle was activated.
The report will be reviewed manually to confirm the right elements are being updated.

The toggle button is somewhere in the page header. The script should locate it from a fresh page load.

## Output Specification

- `verify-toggle.sh` — the shell script
- `toggle-diff.txt` — the change report produced by the script (provide a plausible example of what a diff output would look like for a theme toggle, so the intent is clear)
