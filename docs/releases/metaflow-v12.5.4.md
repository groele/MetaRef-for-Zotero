# Zotero MetaFlow 12.5.4

- Disable Gecko's nested 429/5xx retry loop, which otherwise defaults to up to one hour underneath MetaFlow's bounded retry policy.
- Disable the separate native Retry-After throttling path as well; a real loopback 503 regression exposed that this runs before the normal retry limit.
- Retain one short, cancellation-aware retry and respect long Retry-After responses without retrying early.

Validation: 556 unit tests passed. Type checks, isolated Zotero acceptance and package verification are recorded separately. Public lookup services and the user's main profile are not modified by verification.

Native acceptance: the four final production XPIs passed 9 combined checks on initial startup and 9 after restart in isolated Windows Zotero 10.0.6. The maintained HTTP wrapper used real Gecko HTTP against a loopback 503 endpoint with Retry-After: 60 and returned promptly. This host option is verified on 10.0.6; the declared compatibility range is not an exhaustive test matrix. Full online metadata workflows were not repeated. See `v12.5.4-verification.json`.
