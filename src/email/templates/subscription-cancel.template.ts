export const SubscriptionCanceltemplate = `
  <div style="margin:0; padding:0; background-color:#f4f6fb; font-family: Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6fb; padding:40px 0;">
      <tr>
        <td align="center">
          
          <!-- Main Container -->
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius:12px; padding:40px; box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            
            <!-- Logo -->
            <tr>
              <td align="center" style="padding-bottom:30px;">
                <div style="font-size:24px; font-weight:bold; color:#111827;">
                  ✨ <span style="color:#6366f1;">ResumeAI</span>
                </div>
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td align="center" style="padding-bottom:15px;">
                <h2 style="margin:0; font-size:22px; color:#111827;">
                  Subscription Canceled
                </h2>
              </td>
            </tr>

            <!-- Message -->
            <tr>
              <td align="center" style="padding-bottom:25px;">
                <p style="margin:0; font-size:16px; color:#4b5563; line-height:1.6;">
                  Your premium subscription has been successfully canceled. 
                  You’ve been moved back to the <strong>Free Plan</strong>.
                </p>
              </td>
            </tr>

            <!-- Info Box -->
            <tr>
              <td style="padding:20px; background:#f9fafb; border-radius:8px; border:1px solid #e5e7eb;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="font-size:14px; color:#6b7280;">Previous Plan</td>
                    <td align="right" style="font-size:14px; font-weight:bold; color:#111827;">
                      {{PREVIOUS_PLAN}}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:10px; font-size:14px; color:#6b7280;">Cancellation Date</td>
                    <td align="right" style="padding-top:10px; font-size:14px; font-weight:bold; color:#111827;">
                      {{DATE}}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Spacer -->
            <tr>
              <td align="center" style="padding-top:30px;">
                <p style="margin:0 0 20px 0; font-size:15px; color:#4b5563;">
                  You can upgrade again anytime to unlock premium features.
                </p>
                <a 
                  href="{{LINK}}"
                  style="display:inline-block; padding:14px 28px; background-color:#6366f1; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:bold; font-size:15px;"
                >
                  View Plans
                </a>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:40px 0 20px 0;">
                <hr style="border:none; border-top:1px solid #e5e7eb;">
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center">
                <p style="margin:0; font-size:13px; color:#9ca3af;">
                  We're always working to improve ResumeAI. We'd love to see you back!
                </p>
                <p style="margin:8px 0 0 0; font-size:13px; color:#9ca3af;">
                  © 2026 ResumeAI. All rights reserved.
                </p>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </div>
`;
