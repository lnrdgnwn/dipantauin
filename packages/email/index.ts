interface EmailConfig {
  apiKey: string;
  from: string;
}

export const createEmailService = ({
  apiKey,
  from,
}: EmailConfig) => {
  const sendEmail = async ({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }) => {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          html,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("❌ [Resend Error]:", responseData);
        return { data: null, error: responseData };
      }

      return { data: responseData, error: null };
    } catch (err: any) {
      console.error("❌ [Resend Fetch Error]:", err.message);
      return { data: null, error: err };
    }
  };

  return {
    sendEmail,
  };
};