// Email template generator untuk notifikasi

export interface EmailTemplateParams {
  type: "sale" | "error" | "info";
  title: string;
  message: string;
}

export function getEmailTemplate(params: EmailTemplateParams) {
  const { type, title, message } = params;

  const baseColor =
    type === "sale"
      ? "#10b981"
      : type === "error"
        ? "#ef4444"
        : "#3b82f6";

  const baseColorLight =
    type === "sale"
      ? "#f0fdf4"
      : type === "error"
        ? "#fef2f2"
        : "#eff6ff";

  const icon =
    type === "sale"
      ? "🛍️"
      : type === "error"
        ? "⚠️"
        : "ℹ️";

  const subject = `Adobe Tracker: ${title}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: #f8fafc;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 32px 24px;
          text-align: center;
          color: white;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 32px 24px;
        }
        .notification-box {
          background: ${baseColorLight};
          border-left: 4px solid ${baseColor};
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .notification-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          color: ${baseColor};
          margin: 0 0 8px 0;
        }
        .notification-message {
          font-size: 14px;
          color: #334155;
          margin: 0;
          line-height: 1.6;
        }
        .footer {
          background: #f1f5f9;
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #64748b;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: ${baseColor};
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 16px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Adobe Tracker Notification</h1>
        </div>
        <div class="content">
          <div class="notification-box">
            <div class="notification-title">
              ${icon} ${title}
            </div>
            <p class="notification-message">
              ${message}
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="https://metricstock.com/admin/notifications" class="button">
              View in Dashboard
            </a>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
            ${getNotificationDescription(type)}
          </p>
        </div>
        <div class="footer">
          <p style="margin: 0;">
            Adobe Tracker © 2026 | <a href="#" style="color: #64748b; text-decoration: none;">Notification Settings</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${title}

${message}

View in Dashboard: https://metricstock.com/admin/notifications

${getNotificationDescription(type)}

---
Adobe Tracker © 2026
  `;

  return { subject, html, text };
}

function getNotificationDescription(type: "sale" | "error" | "info"): string {
  switch (type) {
    case "sale":
      return "📊 A new sale has been recorded in your Adobe Tracker. Visit your dashboard to view customer details and payment information.";
    case "error":
      return "⚠️ An error has been detected in your Adobe Tracker system. Please check your dashboard for details and take appropriate action.";
    case "info":
      return "ℹ️ A system update or information notification has been received. Check your dashboard for more details.";
    default:
      return "";
  }
}
