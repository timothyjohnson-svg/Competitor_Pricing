import type { Metadata } from 'next';
import { LicensingWizard } from './licensing-wizard';

export const metadata: Metadata = {
  title: 'Insurance Licensing Requirements Wizard',
  description:
    'Find out exactly what you need to get your insurance license — pre-license hours, exam details, fees, and timeline — personalized for your state and line of authority.',
};

export default function LicensingWizardPage() {
  return <LicensingWizard />;
}
