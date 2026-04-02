# Automated Login Flow Test

## Problem Description

The QA team wants a shell script that validates the login flow of the local web app end-to-end. The script should open the app,
navigate to the login page, sign in using credentials supplied via environment variables (`TEST_USERNAME` and `TEST_PASSWORD`),
and confirm that the user lands on the authenticated section of the app. If the login fails, the script should exit with a non-zero status.

The team runs this before merges to catch auth regressions. It needs to handle the fact that the app is a modern SPA —
pages don't always signal completion immediately after a URL change.

Write the script as `test-login.sh`.

## Output Specification

- `test-login.sh` — a shell script implementing the login flow validation
