# Multi-Page Screenshot Pipeline

## Problem Description

The marketing team wants a nightly script that captures screenshots of the app's three main pages (home, features, and pricing),
then fills out the contact form on the contact page and captures the confirmation state. The screenshots go to a `./screenshots/` folder.

The home, features, and pricing pages are read-only — no interaction needed, just navigate and capture. The contact form requires
filling in a name and email (use the environment variables `CONTACT_NAME` and `CONTACT_EMAIL`) and submitting it.

Write the script as `nightly-capture.sh`.

## Output Specification

- `nightly-capture.sh` — the complete shell script
