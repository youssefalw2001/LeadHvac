import { useEffect } from 'react';

const allowedTrades = ['HVAC', 'Roofing', 'Plumbing', 'Electrical'];
const blockedTerms = ['Pest Control', 'Garage Door', 'pest', 'garage'];

function isBlockedText(text: string) {
  return blockedTerms.some((term) => text.toLowerCase().includes(term.toLowerCase()));
}

function normalizeSelectedIndustry(select: HTMLSelectElement) {
  if (isBlockedText(select.value) || isBlockedText(select.selectedOptions[0]?.textContent || '')) {
    select.value = 'hvac';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

function filterIndustrySelects() {
  document.querySelectorAll('select').forEach((select) => {
    const options = Array.from(select.options);
    const looksLikeIndustrySelect = options.some((option) => allowedTrades.includes(option.textContent?.trim() || '')) && options.some((option) => isBlockedText(option.textContent || option.value));
    if (!looksLikeIndustrySelect) return;

    options.forEach((option) => {
      if (isBlockedText(option.textContent || option.value)) option.remove();
    });
    normalizeSelectedIndustry(select);
  });
}

function filterIndustryCards() {
  const cardSelectors = ['.industry-card', '.tool-card', '.feature-card', '.group.relative.overflow-hidden', 'button'];
  cardSelectors.forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      const text = node.textContent || '';
      if (isBlockedText(text) && (text.includes('Pest') || text.includes('Garage'))) {
        node.style.display = 'none';
        node.setAttribute('data-jobleak-hidden-trade', 'true');
      }
    });
  });
}

function updateTradeCopy() {
  document.querySelectorAll<HTMLElement>('strong, span, p, h2').forEach((node) => {
    if (node.childElementCount > 0) return;
    const text = node.textContent || '';
    if (text.includes('6') && text.toLowerCase().includes('home-service')) {
      node.textContent = text.replace('6', '4');
    }
    if (text.includes('HVAC, roofing, plumbing, electrical, pest control, and garage door')) {
      node.textContent = text.replace('HVAC, roofing, plumbing, electrical, pest control, and garage door', 'HVAC, roofing, plumbing, and electrical');
    }
  });
}

function applyFourTradeMode() {
  filterIndustrySelects();
  filterIndustryCards();
  updateTradeCopy();
}

export function FourTradeModeBoot() {
  useEffect(() => {
    const sync = () => setTimeout(applyFourTradeMode, 60);
    sync();
    window.addEventListener('hashchange', sync);
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('hashchange', sync);
      observer.disconnect();
    };
  }, []);

  return null;
}
