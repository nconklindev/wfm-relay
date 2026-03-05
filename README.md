# WFM Relay

An unofficial, community-built API explorer for UKG Workforce Management.

WFM Relay lets you authenticate against a WFM environment and interactively explore its API endpoints — without writing code or configuring a REST client. Built for administrators, implementers, support engineers, and anyone who regularly works with WFM data.

> **Not affiliated with or endorsed by UKG.** See [Disclaimer](#disclaimer).

---

## Features

- **Interactive and non-interactive authentication** — supports both password-realm and client credentials OAuth flows
- **14+ WFM API endpoints** across five categories: Common Resources, People, Labor Categories, Timekeeping, and Platform
- **Sortable, searchable, paginated results table** — with smart formatting for nested data
- **Dedicated displays** for complex responses like Pay Rules and Adjustment Rules (expandable effective-dated versions)
- **Raw JSON output** with one-click copy
- **CSV Export** for select endpoints
- **Mobile-friendly** — works on any screen size
- **Light and dark mode**

---

## Using the App

New to WFM Relay? Start with the **[User Guide](/guide)** — it covers everything from getting your credentials to reading the results, with no technical knowledge assumed.

---

## Contributing

Bug reports and feature requests are welcome — please use the [issue templates](.github/ISSUE_TEMPLATE/) on GitHub.

For code contributions:

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Open a pull request with a clear description of what changed and why

Please keep pull requests focused — one feature or fix per PR.

---

## Disclaimer

WFM Relay is not affiliated with, endorsed by, or supported by UKG or any of its subsidiaries. It is provided as-is with no warranty of any kind. Use it in accordance with your organization's policies regarding API access.

All API endpoints, request formats, and response structures exposed by this application are sourced from UKG's publicly available developer documentation at [developer.ukg.com](https://developer.ukg.com). No proprietary or non-public information is used. WFM Relay does not interact with the WFM API in any way that is not already documented and intended by UKG — it simply provides a cleaner interface for sending documented requests and reading the responses.

Credentials and tokens are never stored or logged by this application. Authentication tokens are held only in short-lived, HTTP-only session cookies in your browser.
