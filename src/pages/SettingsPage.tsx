import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import NumberInput from '../components/shared/NumberInput';
import WeightStepper from '../components/workout/WeightStepper';
import { useAppContext } from '../context/AppContext';
import { useMaybeAuth } from '../context/AuthContext';
import { DEFAULT_PREFERENCES } from '../types';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { appData, updatePreferences } = useAppContext();
  const auth = useMaybeAuth();
  const { preferences } = appData;
  const [addingRep, setAddingRep] = useState(false);
  const [newRep, setNewRep] = useState<number | ''>('');
  const [accountBusy, setAccountBusy] = useState(false);

  async function handleLogout() {
    if (!auth) return;
    if (!confirm('Log out of your account?')) return;
    try {
      setAccountBusy(true);
      await auth.logout();
    } catch (err) {
      console.error(err);
      alert('Could not log out. Please try again.');
    } finally {
      setAccountBusy(false);
    }
  }

  async function handleDeleteAccount() {
    if (!auth) return;
    if (
      !confirm(
        'Delete your account? This will permanently erase your workouts, exercises, and settings. This cannot be undone.',
      )
    )
      return;
    if (!confirm('Are you absolutely sure? This action is irreversible.')) return;
    try {
      setAccountBusy(true);
      await auth.deleteAccount();
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error && err.message.includes('requires-recent-login')
          ? 'For security, please sign out and sign back in, then try again.'
          : 'Could not delete account. Please try again.';
      alert(message);
    } finally {
      setAccountBusy(false);
    }
  }

  function removeRep(n: number) {
    updatePreferences({
      ...preferences,
      quickReps: preferences.quickReps.filter((v) => v !== n),
    });
  }

  function commitNewRep() {
    if (newRep === '' || typeof newRep !== 'number' || newRep < 1 || newRep > 99) {
      setAddingRep(false);
      setNewRep('');
      return;
    }
    const rounded = Math.round(newRep);
    if (preferences.quickReps.includes(rounded)) {
      setAddingRep(false);
      setNewRep('');
      return;
    }
    const next = [...preferences.quickReps, rounded].sort((a, b) => a - b);
    updatePreferences({ ...preferences, quickReps: next });
    setAddingRep(false);
    setNewRep('');
  }

  function resetReps() {
    if (!confirm('Reset quick rep values to defaults?')) return;
    updatePreferences({ ...preferences, quickReps: [...DEFAULT_PREFERENCES.quickReps] });
  }

  function setStepKg(value: number | '') {
    if (value === '' || typeof value !== 'number') return;
    const clamped = Math.min(50, Math.max(0.25, value));
    updatePreferences({ ...preferences, weightStepKg: clamped });
  }

  return (
    <PageShell title="Settings">
      <div className="space-y-6">
        <Section label="EXERCISE INDEX">
          <button
            type="button"
            onClick={() => navigate('/exercises')}
            className="w-full h-12 flex items-center justify-between px-4 press"
            style={{
              background: '#ffffff',
              border: '1px solid var(--color-line-2)',
              borderRadius: '2px',
              color: 'var(--color-text)',
            }}
          >
            <span className="flex items-center gap-2 caps-tight text-[11px]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" className="w-4 h-4">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              BROWSE EXERCISE LIBRARY
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" className="w-4 h-4" style={{ color: 'var(--color-text-faint)' }}>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </Section>

        <Section
          label="REPS OPTIONS"
          action={
            <button
              type="button"
              onClick={resetReps}
              className="caps text-[10px] press"
              style={{ color: 'var(--color-text)' }}
            >
              RESET
            </button>
          }
        >
          <div className="flex flex-wrap gap-1.5 mb-3">
            {preferences.quickReps.map((n) => (
              <span
                key={n}
                className="inline-flex items-center h-11"
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--color-line-2)',
                  borderRadius: '2px',
                }}
              >
                <span
                  className="font-mono px-3 text-sm"
                  style={{
                    color: 'var(--color-text)',
                    fontWeight: 500,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {n}
                </span>
                <button
                  type="button"
                  onClick={() => removeRep(n)}
                  aria-label={`Remove ${n}`}
                  className="w-10 h-11 flex items-center justify-center press"
                  style={{
                    borderLeft: '1px solid var(--color-line-2)',
                    color: 'var(--color-text-faint)',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" className="w-3.5 h-3.5">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </span>
            ))}
            {!addingRep && (
              <button
                type="button"
                onClick={() => setAddingRep(true)}
                className="h-11 px-4 press caps-tight text-[10px]"
                style={{
                  color: 'var(--color-text)',
                  border: '1px dashed var(--color-line-3)',
                  borderRadius: '2px',
                }}
              >
                ＋ ADD VALUE
              </button>
            )}
          </div>
          {addingRep ? (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <NumberInput
                  label="NEW VALUE 1-99"
                  value={newRep}
                  onChange={setNewRep}
                  placeholder="e.g. 20"
                  min={1}
                />
              </div>
              <button
                type="button"
                onClick={commitNewRep}
                className="h-12 px-4 btn-volt press caps-tight text-[10px]"
                style={{ borderRadius: '2px' }}
              >
                ADD
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingRep(false);
                  setNewRep('');
                }}
                className="h-12 px-3 btn-ghost press caps-tight text-[10px]"
                style={{ borderRadius: '2px' }}
              >
                CANCEL
              </button>
            </div>
          ) : null}
        </Section>

        <Section label="LOAD INCREMENT">
          <WeightStepper label="STEP KG" value={preferences.weightStepKg} onChange={setStepKg} step={0.25} unit="kg" />
          <p
            className="caps-tight text-[9px] mt-3"
            style={{ color: 'var(--color-text-faint)' }}
          >
            USED BY THE +/- STEPPER ON LOG SCREEN
          </p>
        </Section>

        {auth?.user ? (
          <>
            <Section label="ACCOUNT">
              <div
                className="caps-tight text-[10px] mb-3 truncate"
                style={{ color: 'var(--color-text-faint)' }}
              >
                {auth.user.isAnonymous
                  ? 'GUEST SESSION'
                  : auth.user.email || auth.user.displayName || 'SIGNED IN'}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={accountBusy}
                className="w-full h-12 press caps-tight text-[11px]"
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--color-line-2)',
                  borderRadius: '2px',
                  color: 'var(--color-text)',
                  opacity: accountBusy ? 0.5 : 1,
                }}
              >
                LOG OUT
              </button>
            </Section>

            <Section label="DANGER ZONE">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={accountBusy}
                className="w-full h-12 press caps-tight text-[11px]"
                style={{
                  background: '#c0392b',
                  border: '1px solid #c0392b',
                  borderRadius: '2px',
                  color: '#ffffff',
                  fontWeight: 600,
                  opacity: accountBusy ? 0.5 : 1,
                }}
              >
                DELETE ACCOUNT
              </button>
              <p
                className="caps-tight text-[9px] mt-3"
                style={{ color: 'var(--color-text-faint)' }}
              >
                DELETING YOUR ACCOUNT REMOVES ALL WORKOUTS AND SETTINGS. THIS CANNOT BE UNDONE.
              </p>
            </Section>
          </>
        ) : null}

      </div>
    </PageShell>
  );
}

function Section({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="caps text-[10px]" style={{ color: 'var(--color-text)' }}>
          {label}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
