# Email Deliverability

The Mail Service generates RFC-compliant messages, including `Date` and
`Message-ID` headers. Gmail and other major inbox providers also require the
sending domain to authenticate the server that sends mail for that domain.

If `MAIL_FROM=company@1111.tn`, then DNS for `1111.tn` must prove that the SMTP
server is allowed to send mail for `1111.tn`. Code cannot fix SPF, DKIM, or
DMARC failures; these records must be configured at the DNS and mail-provider
level.

## Required DNS Records

### SPF

Add or update exactly one TXT record at the root domain:

```text
Name: 1111.tn
Type: TXT
Value: v=spf1 mx a ip4:70.38.21.234 include:YOUR_SMTP_PROVIDER_SPF ~all
```

Use the real provider include value from your SMTP host. If your hosting provider
says to use only an `include`, use that instead of the example. Do not create
multiple SPF TXT records; merge all allowed senders into one record.

### DKIM

Enable DKIM signing in the mail provider control panel for `1111.tn`, then add
the TXT record it gives you. The selector and value are provider-specific.

Example shape:

```text
Name: default._domainkey.1111.tn
Type: TXT
Value: v=DKIM1; k=rsa; p=...
```

### DMARC

Start with monitoring mode, then tighten after SPF and DKIM pass:

```text
Name: _dmarc.1111.tn
Type: TXT
Value: v=DMARC1; p=none; rua=mailto:postmaster@1111.tn; adkim=s; aspf=s
```

After successful delivery is stable, move to `p=quarantine` or `p=reject`.

## Recommended Production Setup

Use a transactional provider such as SendGrid, Mailgun, Brevo, Postmark, or AWS
SES, authenticate `1111.tn` in that provider, and set:

```env
MAIL_PROVIDER=smtp
SMTP_HOST=<provider smtp host>
SMTP_PORT=587
SMTP_USER=<provider smtp user>
SMTP_PASS=<provider smtp password>
MAIL_FROM=company@1111.tn
```

For SendGrid API mode:

```env
MAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=<key>
MAIL_FROM=company@1111.tn
```

## How To Verify

Send a test message to Gmail and inspect "Show original". The result should show:

```text
SPF: PASS
DKIM: PASS
DMARC: PASS
```

At least SPF or DKIM must pass with alignment for Gmail to accept the message.
