# Email Configuration for OTP Service

The OTP service now uses NodeMailer for sending actual emails. You need to configure your email settings in your environment variables.

## Required Environment Variables

Add these to your `.env` file:

```env
# Email Configuration for NodeMailer
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=PlayStation Finder <noreply@playstation-finder.com>
```

## Gmail Setup (Recommended)

1. **Create a Gmail account** or use an existing one
2. **Enable 2-Factor Authentication** on your Gmail account
3. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password as `EMAIL_PASS`

## Other Email Providers

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

### Custom SMTP
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_SECURE=false  # or true for SSL
```

## Testing

- If email configuration is not set up, the service will fall back to console logging
- Check your console for OTP codes during development
- Once configured, emails will be sent with a professional HTML template

## Security Notes

- Never commit your `.env` file to version control
- Use app passwords instead of regular passwords
- For production, consider using a dedicated email service like SendGrid or AWS SES 