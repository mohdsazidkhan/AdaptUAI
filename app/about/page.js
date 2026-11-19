import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'About',
  description: 'AdaptUAI is an AI tutor that adapts to how you learn: your pace, confidence and learning style.',
};

export default function AboutPage() {
  return (
    <LegalPage
      current="/about"
      title="About AdaptUAI"
      showUpdated={false}
      intro="AdaptUAI is an AI tutor that adapts to you. Ask about any subject (maths, science, coding, history, languages, career skills) and it explains in the way that works best for you."
      sections={[
        {
          heading: 'What makes it different',
          body: [
            'It learns your mindset: confidence, patience, learning style and how deep you like to go.',
            'It changes its tone and depth to match: simpler and supportive when you are stuck, more challenging when you are doing well.',
            'Teaching, Quiz, Revision and Doubt Solving modes switch on from what you ask.',
            'It keeps track of topics you explore and areas that need more practice.',
            'You can ask by typing, by voice, or by sending a photo of a question.',
          ],
        },
        {
          heading: 'How it works',
          body: [
            'Create a free account. New accounts get welcome AU tokens.',
            'Chat with the AI tutor. Each answer uses a small number of AU tokens from your wallet.',
            'The more you learn, the more personal your tutor becomes.',
          ],
        },
        {
          heading: 'AU tokens',
          body: 'AU is the credit used for AI answers. You can see your balance and every spend in Wallet and History. To recharge, contact our support team by email or WhatsApp.',
        },
        {
          heading: 'Our promise',
          body: 'Your chats are private to your account. We use them only to run and improve your tutor, we never sell them, and you can contact us any time to have your data removed.',
        },
      ]}
    />
  );
}
