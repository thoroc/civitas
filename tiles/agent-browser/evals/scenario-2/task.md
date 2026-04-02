# Navigation Link Audit

## Problem Description

The SEO team wants a JSON inventory of every link in the app's main navigation bar — specifically the visible link text and its
`href` value for each anchor element inside the `<nav>` element. They need this to audit internal linking before a site restructure.

Write a shell script `extract-nav-links.sh` that opens the local app, pulls the navigation link data using JavaScript,
and saves the result as `nav-links.json` in the working directory. The JSON should be an array of objects, each with `text` and `href` fields.

The nav element uses a standard HTML `<nav>` tag. The script should handle the fact that the app is a client-rendered SPA, so the nav may not be populated immediately after the page loads.

## Output Specification

- `extract-nav-links.sh` — shell script that drives the browser and saves the data
- `nav-links.json` — expected output format (provide a realistic example of what the output would look like, so the script's intent is clear)
