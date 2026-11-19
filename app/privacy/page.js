import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Privacy Policy',
  description: 'What data AdaptUAI collects, why, and how you can control it.',
};

export default function PrivacyPage() {
  return (
    <LegalPage
      current="/privacy"
      title="Privacy Policy"
      intro="This policy explains what information AdaptUAI collects when you use it, why we collect it, who we share it with and the choices you have."
      sections={[
        {
          heading: 'Information we collect',
          body: [
            'Account details: your name, email address and an encrypted (hashed) password.',
            'Chats: the questions you ask, the AI answers, chat titles and topics.',
            'Photos you attach to a question. They are stored with our image host so your chat can show them later.',
            'Learning profile: confidence, patience, learning style, topics explored and areas that need practice, worked out from how you use the tutor (for example message length, retries and response time).',
            'Wallet: your AU balance and AU transactions.',
            'Basic technical data, such as a login cookie that keeps you signed in.',
          ],
        },
        {
          heading: 'Voice input',
          body: 'When you use the microphone button, your browser’s built-in speech service (for example Google in Chrome) turns speech into text. AdaptUAI does not record or store audio, only the text you choose to send.',
        },
        {
          heading: 'How we use it',
          body: [
            'To run the AI tutor and show your chat history.',
            'To personalise answers to your learning profile.',
            'To manage your AU wallet and prevent misuse.',
            'To answer your support requests and improve the service.',
          ],
        },
        {
          heading: 'Who we share it with',
          body: [
            'AI model providers (through OpenRouter): your question, recent chat messages and any attached photo are sent to them to generate an answer.',
            'Cloudinary: stores photos you attach.',
            'Our database and hosting providers: store your account and chat data.',
            'We do not sell your personal data and do not use it for advertising.',
            'We may disclose information if the law requires it.',
          ],
        },
        {
          heading: 'Cookies and local storage',
          body: 'We use a secure cookie to keep you logged in, and your browser’s local storage for preferences such as light or dark theme. We do not use advertising cookies.',
        },
        {
          heading: 'How long we keep data',
          body: 'We keep your account, chats and wallet history while your account is active. When you ask us to delete your account, we delete your personal data within a reasonable time, except records we must keep by law.',
        },
        {
          heading: 'Security',
          body: 'Passwords are hashed, connections use HTTPS and access to data is limited. No system is perfectly secure, so please use a strong, unique password.',
        },
        {
          heading: 'Your choices and rights',
          body: 'You can view and update your profile in the app. You can ask us to access, correct, export or delete your data by emailing us.',
        },
        {
          heading: 'Children',
          body: 'AdaptUAI is meant for learners aged 13 and above. If you are under 18, use it with a parent or guardian’s permission. If you believe a child under 13 has given us data, contact us and we will delete it.',
        },
        {
          heading: 'Changes to this policy',
          body: 'We may update this policy and will change the “Last updated” date above. For important changes we will let you know in the app.',
        },
      ]}
    />
  );
}
