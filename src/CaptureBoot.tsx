import { useEffect } from 'react';
import { saveLead } from './leadCapture';

export function CaptureBoot() {
  useEffect(() => {
    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button');
      if (!button || !button.textContent?.includes('Generate Free Scan')) return;

      const card = button.closest('.scan-card');
      if (!card) return;

      const inputs = Array.from(card.querySelectorAll('input')) as HTMLInputElement[];
      const select = card.querySelector('select') as HTMLSelectElement | null;
      const textarea = card.querySelector('textarea') as HTMLTextAreaElement | null;

      const [businessName, city, website, email, phone] = inputs.map((input) => input.value.trim());

      try {
        await saveLead({
          businessName: businessName || 'Unknown business',
          industry: select?.value || 'roofing',
          city: city || 'Unknown market',
          website: website || '',
          email: email || '',
          phone: phone || '',
          goal: textarea?.value.trim() || ''
        });
      } catch (error) {
        console.error('Lead capture failed', error);
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
