import { useCallback, useState } from 'react';
import {
  disableMfaRequest,
  enableMfaRequest,
  extractErrorMessage,
  setupMfaRequest,
} from '../api/auth.api.js';
import { useAuth } from './useAuth.js';

// useMfa: manages the multi-factor-auth workflow (setup QR, enable, disable) and its loading/error state.
export function useMfa() {
  const { user, setUser } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [otpauthUrl, setOtpauthUrl] = useState(null);
  const [backupCodes, setBackupCodes] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const startSetup = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await setupMfaRequest();
      setQrDataUrl(data.qrDataUrl);
      setOtpauthUrl(data.otpauthUrl);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not start MFA setup'));
    } finally {
      setBusy(false);
    }
  }, []);

  const enable = useCallback(
    async (code) => {
      setBusy(true);
      setError(null);
      try {
        const data = await enableMfaRequest({ code });
        setBackupCodes(data.backupCodes);
        setQrDataUrl(null);
        setUser((current) => (current ? { ...current, mfaEnabled: true } : current));
        return true;
      } catch (err) {
        setError(extractErrorMessage(err, 'Could not enable MFA'));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [setUser],
  );

  const disable = useCallback(
    async (payload) => {
      setBusy(true);
      setError(null);
      try {
        await disableMfaRequest(payload);
        setBackupCodes(null);
        setUser((current) => (current ? { ...current, mfaEnabled: false } : current));
        return true;
      } catch (err) {
        setError(extractErrorMessage(err, 'Could not disable MFA'));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [setUser],
  );

  return { mfaEnabled: Boolean(user?.mfaEnabled), qrDataUrl, otpauthUrl, backupCodes, error, busy, startSetup, enable, disable };
}
