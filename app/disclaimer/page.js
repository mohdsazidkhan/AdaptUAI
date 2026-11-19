import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Disclaimer',
  description: 'Important limits of AI-generated answers on AdaptUAI.',
};

export default function DisclaimerPage() {
  return (
    <LegalPage
      current="/disclaimer"
      title="Disclaimer"
      intro="AdaptUAI is a learning tool. Please read this before relying on its answers."
      sections={[
        {
          heading: 'AI can make mistakes',
          body: 'Answers are generated automatically by AI models. They can be incomplete, out of date or simply wrong, even when they sound confident. Always check important facts, formulas, dates and code with a trusted source, your teacher or official material.',
        },
        {
          heading: 'Not professional advice',
          body: 'Nothing on AdaptUAI is medical, legal, financial, tax, psychological or other professional advice. For decisions in these areas, consult a qualified professional.',
        },
        {
          heading: 'Exams and coursework',
          body: 'Use AdaptUAI to understand topics, not to submit AI answers as your own work where that is not allowed. Follow the rules of your school, university or exam board.',
        },
        {
          heading: 'Learning profile',
          body: 'Your learning profile (confidence, patience, learning style, weak areas) is an automatic estimate based on how you use the tutor. It is meant to personalise answers, not to judge your ability.',
        },
        {
          heading: 'Photos and voice',
          body: 'Photo reading and speech-to-text can misread handwriting, diagrams or words. Check the text in the box and the question the AI solved before trusting the answer.',
        },
        {
          heading: 'External links',
          body: 'Answers may mention other websites or resources. We do not control them and are not responsible for their content.',
        },
        {
          heading: 'Limitation of liability',
          body: 'AdaptUAI and its team are not responsible for any loss or damage that comes from relying on AI-generated content. Use the service with your own judgement.',
        },
      ]}
    />
  );
}
