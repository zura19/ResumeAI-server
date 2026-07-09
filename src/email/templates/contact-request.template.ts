export const contactRequestTemplate = `
  <div style="margin:0; padding:0; background-color:#f4f6fb; font-family:Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6fb; padding:40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius:12px; padding:40px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            <tr>
              <td align="center" style="padding-bottom:30px;">
                <div style="font-size:24px; font-weight:bold; color:#111827;">
                  <span style="color:#6366f1;">ResumeAI</span>
                </div>
              </td>
            </tr>

            <tr>
              <td align="center" style="padding-bottom:25px;">
                <h2 style="margin:0; font-size:22px; color:#111827;">
                  New Contact Request
                </h2>
              </td>
            </tr>

            <tr>
              <td style="padding:20px; background:#f9fafb; border-radius:8px; border:1px solid #e5e7eb;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:14px; color:#6b7280;">Reply-To</td>
                    <td align="right" style="font-size:14px; font-weight:bold; color:#111827;">{{REPLY_TO}}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:10px; font-size:14px; color:#6b7280;">User ID</td>
                    <td align="right" style="padding-top:10px; font-size:14px; font-weight:bold; color:#111827;">{{USER_ID}}</td>
                  </tr>
                  <tr>
                    <td style="padding-top:10px; font-size:14px; color:#6b7280;">Title</td>
                    <td align="right" style="padding-top:10px; font-size:14px; font-weight:bold; color:#111827;">{{TITLE}}</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding-top:30px;">
                <p style="margin:0 0 10px 0; font-size:15px; font-weight:bold; color:#111827;">
                  Description
                </p>
                <p style="margin:0; font-size:15px; color:#4b5563; line-height:1.6; word-break:break-word;">
                  {{DESCRIPTION}}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:40px 0 20px 0;">
                <hr style="border:none; border-top:1px solid #e5e7eb;">
              </td>
            </tr>

            <tr>
              <td align="center">
                <p style="margin:0; font-size:13px; color:#9ca3af;">
                  This request was sent from the ResumeAI contact form.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;
