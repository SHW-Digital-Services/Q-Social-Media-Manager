# Scheduled publishing

The publishing worker is exposed at `/api/cron/publish` and requires:

```text
Authorization: Bearer <CRON_SECRET>
```

Vercel Hobby does not support sub-daily Cron Jobs, so this project intentionally
does not declare a Vercel cron in `vercel.json`. Use one of these production
options:

- Upgrade the Vercel project to Pro and add a cron for `/api/cron/publish` with
  `* * * * *`.
- Use an external scheduler that sends the request every minute. Configure the
  request URL as `https://<APP_URL>/api/cron/publish`, method `GET`, and the
  `Authorization` header from the Vercel `CRON_SECRET` variable.

The endpoint claims due jobs atomically, processes each platform once, and marks
ambiguous provider responses as `uncertain` so they are not automatically sent
again.
