export const Welcometemplate = `
  <div
    style="
      margin: 0;
      padding: 0;
      background-color: #f4f6fb;
      font-family: Arial, sans-serif;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="background-color: #f4f6fb; padding: 40px 0"
    >
      <tr>
        <td align="center">
          <!-- Main Container -->
          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="
              background: #ffffff;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            "
          >
            <!-- Logo Section -->
            <tr>
              <td align="center" style="padding-bottom: 30px">
                <div style="font-size: 24px; font-weight: bold; color: #111827">
                  ✨ <span style="color: #6366f1">ResumeAI</span>
                </div>
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td align="center" style="padding-bottom: 20px">
                <h2 style="margin: 0; font-size: 22px; color: #111827">
                  Welcome to ResumeAI, {{NAME}}
                </h2>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td align="center" style="padding-bottom: 30px">
                <p
                  style="
                    margin: 0;
                    font-size: 16px;
                    color: #4b5563;
                    line-height: 1.6;
                  "
                >
                  Your smarter way to build professional resumes with AI
                  assistance. Create, optimize, and stand out from the crowd in
                  minutes.
                </p>
              </td>
            </tr>

            <!-- Button -->
            <tr>
              <td align="center">
                <a
                  href="{{LINK}}"
                  style="
                    display: inline-block;
                    padding: 14px 28px;
                    background-color: #6366f1;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    font-size: 15px;
                  "
                >
                  Get Started
                </a>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding: 40px 0 20px 0">
                <hr style="border: none; border-top: 1px solid #e5e7eb" />
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center">
                <p style="margin: 0; font-size: 13px; color: #9ca3af">
                  © 2026 ResumeAI. All rights reserved.
                </p>
                <p style="margin: 8px 0 0 0; font-size: 13px; color: #9ca3af">
                  If you didn’t request this email, you can safely ignore it.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;
