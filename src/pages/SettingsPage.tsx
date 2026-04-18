import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import NumberInput from '../components/shared/NumberInput';
import WeightStepper from '../components/workout/WeightStepper';
import { useAppContext } from '../context/AppContext';
import { DEFAULT_PREFERENCES } from '../types';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { appData, updatePreferences } = useAppContext();
  const { preferences } = appData;
  const [addingRep, setAddingRep] = useState(false);
  const [newRep, setNewRep] = useState<number | ''>('');

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
        <Section label="EXERCISE INDEX" index="01">
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
          index="02"
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

        <Section label="LOAD INCREMENT" index="03">
          <WeightStepper label="STEP KG" value={preferences.weightStepKg} onChange={setStepKg} step={0.25} unit="kg" />
          <p
            className="caps-tight text-[9px] mt-3"
            style={{ color: 'var(--color-text-faint)' }}
          >
            USED BY THE +/- STEPPER ON LOG SCREEN
          </p>
        </Section>

        {/* signature block */}
        <div
          className="pt-4 mt-4"
          style={{ borderTop: '1px solid var(--color-line)' }}
        >
          <div
            className="caps-tight text-[9px]"
            style={{ color: 'var(--color-text-faint)' }}
          >
            LIFTGAUGE TRAINING JOURNAL v0.1
          </div>
          <div
            className="caps-tight text-[9px] mt-1"
            style={{ color: 'var(--color-text-faint)' }}
          >
            BUILT FOR THE RACK
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Section({
  label,
  index,
  action,
  children,
}: {
  label: string;
  index: string;
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
