import { useEffect, useState } from 'react';
import { errorHaptic, successHaptic, tapHaptic } from '../utils/haptics';
import { playClickSound } from '../utils/sound';
import { submitToWeb3Forms, Web3FormsFields } from '../utils/web3forms';
import { CONFIRMATION_DURATION_MS } from '../utils/ui';

interface UseReportFormOptions {
  fromName: string;
  buildSubject: (primary: string) => string;
  buildFields: (primary: string, secondary: string) => Web3FormsFields;
}

/**
 * מנהל את המצב המשותף לכל טופס דיווח (מילה שגויה / באג): פתיחה/סגירה,
 * שני שדות טקסט, שליחה ל-Web3Forms, והודעת "תודה" שנסגרת לבד.
 */
export function useReportForm({ fromName, buildSubject, buildFields }: UseReportFormOptions) {
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [primary, setPrimary] = useState('');
  const [secondary, setSecondary] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submitted || !visible) return;
    const timer = setTimeout(() => setVisible(false), CONFIRMATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [submitted, visible]);

  function open() {
    tapHaptic();
    playClickSound();
    setSubmitted(false);
    setPrimary('');
    setSecondary('');
    setError(null);
    setVisible(true);
  }

  function close() {
    // בזמן שליחה חוסמים סגירה כדי שהמודאל לא ייעלם באמצע הבקשה
    if (sending) return;
    playClickSound();
    setError(null);
    setVisible(false);
  }

  async function submit() {
    if (sending || !primary.trim()) return;
    playClickSound();
    setSending(true);
    setError(null);

    const trimmedPrimary = primary.trim();
    const result = await submitToWeb3Forms(
      buildSubject(trimmedPrimary),
      fromName,
      buildFields(trimmedPrimary, secondary.trim())
    );

    setSending(false);

    if (!result.success) {
      errorHaptic();
      setError(result.message ?? 'השליחה נכשלה. נסו שוב.');
      return;
    }

    successHaptic();
    setSubmitted(true);
  }

  return {
    visible,
    submitted,
    primary,
    setPrimary,
    secondary,
    setSecondary,
    sending,
    error,
    open,
    close,
    submit,
  };
}
