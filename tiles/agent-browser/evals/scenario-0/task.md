# Weekly Design Review Capture

## Problem Description

The design team holds a weekly review of the local web app's UI. They want a repeatable shell script they can run before each meeting
to capture screenshots of the three main sections of the app: the homepage, the dashboard, and the settings page.
The screenshots get dropped into a shared folder for async feedback.

The script needs to be robust enough for any team member to run — it must not hardcode any secrets and should clean up after itself.
The app runs locally during development and there is no need to reach external services.

Write the script as `capture-review.sh`.

## Output Specification

- `capture-review.sh` — a shell script that automates the browser capture workflow
