'use client';

import { useState, useEffect, useCallback } from 'react';
import type { LicensingRequirement } from '@/db/schema/licensing-requirements';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type StateOption = { state: string; stateName: string; comingSoon: boolean };
type LineOption = { lineOfAuthority: string; lineOfAuthorityLabel: string; comingSoon: boolean };

type PersonaKey =
  | 'brand-new'
  | 'adding-line'
  | 'licensed-other-state'
  | 'failed-first-attempt';

const PERSONA_OPTIONS: { key: PersonaKey; label: string; description: string }[] = [
  {
    key: 'brand-new',
    label: "I'm brand new to insurance",
    description: 'No prior license — starting from scratch.',
  },
  {
    key: 'adding-line',
    label: "I'm adding a line of authority",
    description: 'Already licensed in at least one line in this state.',
  },
  {
    key: 'licensed-other-state',
    label: "I'm licensed in another state",
    description: 'Looking for reciprocity or non-resident options.',
  },
  {
    key: 'failed-first-attempt',
    label: "I didn't pass the first time",
    description: 'Need to retake the exam with better prep.',
  },
];

// ---------------------------------------------------------------------------
// Persona-aware messaging
// ---------------------------------------------------------------------------
function getPersonaMessage(persona: PersonaKey | null, req: LicensingRequirement): string | null {
  if (!persona) return null;
  switch (persona) {
    case 'brand-new':
      return `Starting fresh in ${req.stateName}? You're in good company — thousands of new agents get licensed every year. Here's your step-by-step roadmap.`;
    case 'adding-line':
      return `You already know the process. Adding ${req.lineOfAuthorityLabel} in ${req.stateName} means a separate pre-license course and exam, but you'll move faster this time.`;
    case 'licensed-other-state':
      return req.reciprocityAvailable
        ? `Good news — ${req.stateName} offers reciprocity. ${req.reciprocityNotes ?? 'You may be able to skip some or all pre-license education.'}`
        : `${req.stateName} does not offer reciprocity for this line. You'll need to complete the full pre-license education and pass the state exam.`;
    case 'failed-first-attempt':
      return `Most retakers pass on their next attempt with the right prep. Here's exactly what ${req.stateName} requires so you can focus your study time where it counts.`;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function LicensingWizard() {
  // Wizard state
  const [step, setStep] = useState(1);
  const [states, setStates] = useState<StateOption[]>([]);
  const [lines, setLines] = useState<LineOption[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<PersonaKey | null>(null);
  const [requirement, setRequirement] = useState<LicensingRequirement | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch available states on mount
  useEffect(() => {
    fetch('/api/licensing-requirements')
      .then((r) => r.json())
      .then((data: { states: StateOption[] }) => setStates(data.states ?? []))
      .catch(() => {/* graceful */});
  }, []);

  // Fetch lines when state changes
  useEffect(() => {
    if (!selectedState) return;
    setLines([]);
    setSelectedLine('');
    fetch(`/api/licensing-requirements?state=${selectedState}`)
      .then((r) => r.json())
      .then((data: { lines: LineOption[] }) => setLines(data.lines ?? []))
      .catch(() => {/* graceful */});
  }, [selectedState]);

  // Fetch full requirement
  const fetchRequirement = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/licensing-requirements?state=${selectedState}&line=${selectedLine}`,
      );
      const data = (await res.json()) as { requirement: LicensingRequirement };
      setRequirement(data.requirement ?? null);
      setStep(4);
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedLine]);

  // Helpers
  const stateName = states.find((s) => s.state === selectedState)?.stateName ?? selectedState;
  // ---------------------------------------------------------------------------
  // Step indicator
  // ---------------------------------------------------------------------------
  const stepLabels = ['State', 'License Type', 'About You', 'Your Roadmap'];

  function StepIndicator() {
    return (
      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-10">
        {stepLabels.map((label, i) => {
          const num = i + 1;
          const isActive = num === step;
          const isComplete = num < step;
          return (
            <div key={label} className="flex items-center gap-1 sm:gap-2">
              {i > 0 && (
                <div
                  className={`h-0.5 w-6 sm:w-10 rounded ${isComplete ? 'bg-[#12BDCD]' : 'bg-[#D3DDDF]'}`}
                />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold
                    ${isActive ? 'bg-[#12BDCD] text-white' : isComplete ? 'bg-[#2CE1AB] text-white' : 'bg-[#E8EEEF] text-[#436F6F]'}`}
                >
                  {isComplete ? '✓' : num}
                </div>
                <span
                  className={`hidden sm:inline text-sm font-semibold ${isActive ? 'text-[#21333F]' : 'text-[#436F6F]'}`}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F4F9FC]">
      {/* Hero header */}
      <div className="bg-[#21333F] py-12 px-4 text-center">
        <p className="text-xs font-extrabold uppercase tracking-[0.05em] text-[#12BDCD] mb-3">
          Insurance Licensing
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
          Your Personalized Licensing Roadmap
        </h1>
        <p className="mt-3 text-base text-[#AFC1C6] max-w-xl mx-auto">
          Answer a few quick questions and we&apos;ll show you exactly what you need — hours,
          exams, fees, and timeline.
        </p>
      </div>

      {/* Main card */}
      <div className="max-w-[720px] mx-auto -mt-6 px-4 pb-16">
        <div className="rounded-xl bg-white shadow-[0_8px_12px_rgba(34,34,34,0.1)] p-6 sm:p-10">
          <StepIndicator />

          {/* ---- Step 1: State ---- */}
          {step === 1 && (
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-[#21333F] mb-2">
                What state are you getting licensed in?
              </h2>
              <p className="text-[#436F6F] mb-8">
                Each state has different requirements. We&apos;ll tailor everything to yours.
              </p>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full max-w-sm mx-auto block rounded-lg border-[1.5px] border-[#B7BEC1] bg-white px-4 py-3 text-base text-[#21333F] appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23436F6F%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat focus:outline-none focus:ring-2 focus:ring-[#12BDCD]"
              >
                <option value="">Select your state...</option>
                {states.filter((s) => !s.comingSoon).map((s) => (
                  <option key={s.state} value={s.state}>
                    {s.stateName}
                  </option>
                ))}
                {states.some((s) => s.comingSoon) && (
                  <option disabled>── Coming Soon ──</option>
                )}
                {states.filter((s) => s.comingSoon).map((s) => (
                  <option key={s.state} value={s.state}>
                    {s.stateName} (Coming Soon)
                  </option>
                ))}
              </select>
              <button
                disabled={!selectedState}
                onClick={() => setStep(2)}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#DB306A] px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-[#C50B4A] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          )}

          {/* ---- Step 2: Line of Authority ---- */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-extrabold text-[#21333F] mb-2 text-center">
                What line of authority?
              </h2>
              <p className="text-[#436F6F] mb-8 text-center">
                Select the type of insurance license you&apos;re pursuing in {stateName}.
              </p>
              <div className="grid gap-3 max-w-md mx-auto">
                {lines.map((l) => (
                  <button
                    key={l.lineOfAuthority}
                    onClick={() => setSelectedLine(l.lineOfAuthority)}
                    className={`w-full text-left rounded-lg border-[1.5px] px-5 py-4 transition-all
                      ${
                        selectedLine === l.lineOfAuthority
                          ? 'border-[#12BDCD] bg-[#F3FBFC] shadow-sm'
                          : 'border-[#D3DDDF] bg-white hover:border-[#12BDCD] hover:bg-[#F8FDFD]'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors
                          ${selectedLine === l.lineOfAuthority ? 'border-[#12BDCD] bg-[#12BDCD]' : 'border-[#B7BEC1]'}`}
                      >
                        {selectedLine === l.lineOfAuthority && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-base font-bold text-[#21333F]">
                        {l.lineOfAuthorityLabel}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-center gap-3 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-[#169AA9] font-extrabold underline underline-offset-4 decoration-[1.5px] hover:text-[#197AA5]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Back
                </button>
                <button
                  disabled={!selectedLine}
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#DB306A] px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-[#C50B4A] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* ---- Step 3: Persona ---- */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-extrabold text-[#21333F] mb-2 text-center">
                Tell us about you
              </h2>
              <p className="text-[#436F6F] mb-8 text-center">
                This helps us personalize your roadmap.
              </p>
              <div className="grid gap-3 max-w-md mx-auto">
                {PERSONA_OPTIONS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setSelectedPersona(p.key)}
                    className={`w-full text-left rounded-lg border-[1.5px] px-5 py-4 transition-all
                      ${
                        selectedPersona === p.key
                          ? 'border-[#12BDCD] bg-[#F3FBFC] shadow-sm'
                          : 'border-[#D3DDDF] bg-white hover:border-[#12BDCD] hover:bg-[#F8FDFD]'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors
                          ${selectedPersona === p.key ? 'border-[#12BDCD] bg-[#12BDCD]' : 'border-[#B7BEC1]'}`}
                      >
                        {selectedPersona === p.key && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <span className="text-base font-bold text-[#21333F]">{p.label}</span>
                        <p className="text-sm text-[#436F6F] mt-0.5">{p.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-center gap-3 mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1 text-[#169AA9] font-extrabold underline underline-offset-4 decoration-[1.5px] hover:text-[#197AA5]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  Back
                </button>
                <button
                  disabled={!selectedPersona}
                  onClick={fetchRequirement}
                  className="inline-flex items-center gap-2 rounded-full bg-[#DB306A] px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-[#C50B4A] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Loading...' : 'Show My Roadmap'}
                  {!loading && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ---- Step 4: Results ---- */}
          {step === 4 && requirement && (
            <ResultsView
              requirement={requirement}
              persona={selectedPersona}
              onStartOver={() => {
                setStep(1);
                setSelectedState('');
                setSelectedLine('');
                setSelectedPersona(null);
                setRequirement(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results view
// ---------------------------------------------------------------------------
function ResultsView({
  requirement: req,
  persona,
  onStartOver,
}: {
  requirement: LicensingRequirement;
  persona: PersonaKey | null;
  onStartOver: () => void;
}) {
  const totalCost =
    Number(req.examFee ?? 0) +
    Number(req.stateLicenseFee ?? 0) +
    Number(req.backgroundCheckFee ?? 0) +
    Number(req.aceableProductPrice ?? 0);

  const personaMsg = getPersonaMessage(persona, req);

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.05em] text-[#12BDCD] mb-2">
          {req.stateName} &middot; {req.lineOfAuthorityLabel}
        </p>
        <h2 className="text-2xl font-extrabold text-[#21333F]">Your Licensing Roadmap</h2>
        {personaMsg && (
          <p className="mt-3 text-[#436F6F] max-w-lg mx-auto text-sm leading-relaxed">
            {personaMsg}
          </p>
        )}
      </div>

      {/* Checklist cards */}
      <div className="grid gap-4">
        {/* 1. Pre-License Education */}
        <ChecklistCard
          number={1}
          title={req.totalPreLicenseHours > 0 ? 'Complete Pre-License Education' : 'Exam Prep (Recommended)'}
          color="#12BDCD"
          items={[
            req.totalPreLicenseHours > 0
              ? `${req.totalPreLicenseHours} hours of state-approved coursework`
              : `${req.stateName} does not require pre-license education — but exam prep significantly improves pass rates`,
            req.courseTopics ? `Topics: ${req.courseTopics}` : null,
            req.aceableProductPrice
              ? `Aceable course: $${Number(req.aceableProductPrice).toFixed(0)}`
              : null,
          ]}
        />

        {/* 2. Exam */}
        {req.examRequired && (
          <ChecklistCard
            number={2}
            title="Pass the State Exam"
            color="#FF3072"
            items={[
              req.examProvider ? `Provider: ${req.examProvider}` : null,
              req.examQuestions && req.examTimeMinutes
                ? `${req.examQuestions} questions in ${req.examTimeMinutes} minutes`
                : null,
              req.examPassingScore ? `Passing score: ${req.examPassingScore}%` : null,
              req.examFee ? `Exam fee: $${Number(req.examFee).toFixed(2)}` : null,
              req.examRetakeWaitDays !== null && req.examRetakeWaitDays !== undefined
                ? req.examRetakeWaitDays === 0
                  ? 'No waiting period to retake'
                  : `${req.examRetakeWaitDays}-day wait before retake`
                : null,
            ]}
          />
        )}

        {/* 3. Background Check & Fingerprints */}
        {(req.backgroundCheckRequired || req.fingerprintRequired) && (
          <ChecklistCard
            number={3}
            title="Background Check & Fingerprints"
            color="#FCB11A"
            items={[
              req.backgroundCheckRequired
                ? `Background check required — $${Number(req.backgroundCheckFee ?? 0).toFixed(2)}`
                : 'Background check: not required',
              req.fingerprintRequired
                ? 'Electronic fingerprinting required (IdentoGO)'
                : 'Fingerprinting: not required',
            ]}
          />
        )}

        {/* 4. Apply */}
        <ChecklistCard
          number={req.backgroundCheckRequired || req.fingerprintRequired ? 4 : 3}
          title="Apply for Your License"
          color="#2CE1AB"
          items={[
            req.stateLicenseFee ? `State license fee: $${Number(req.stateLicenseFee).toFixed(2)}` : null,
            `Minimum age: ${req.minimumAge}`,
            req.residencyRequired
              ? `${req.stateName} residency required`
              : 'No state residency requirement',
            req.doiUrl ? `Apply through the ${req.stateName} Department of Insurance` : null,
          ]}
        />
      </div>

      {/* Summary banner */}
      <div className="mt-8 rounded-xl bg-[#21333F] p-6 text-center">
        <div className="flex flex-wrap justify-center gap-8 mb-4">
          <SummaryMetric label="Estimated Timeline" value={`${req.estimatedTimelineDays ?? '—'} days`} />
          <SummaryMetric label="Total Estimated Cost" value={`$${totalCost.toFixed(0)}`} />
          <SummaryMetric label="Pre-License Hours" value={req.totalPreLicenseHours > 0 ? `${req.totalPreLicenseHours} hrs` : 'None required'} />
        </div>
        {req.notes && (
          <p className="text-sm text-[#AFC1C6] mt-2 max-w-lg mx-auto">{req.notes}</p>
        )}
      </div>

      {/* CTA */}
      {req.comingSoon ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-[#12BDCD] bg-[#F3FBFC] p-6 text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.05em] text-[#12BDCD] mb-2">
            Coming Soon
          </p>
          <p className="text-base font-bold text-[#21333F]">
            Our {req.stateName} {req.lineOfAuthorityLabel} course is launching soon.
          </p>
          <p className="text-sm text-[#436F6F] mt-1">
            The licensing requirements above are accurate — bookmark this page and check back for course availability.
          </p>
          {req.aceableProductUrl && (
            <a
              href={req.aceableProductUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#12BDCD] px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-[#169AA9]"
            >
              Join the Waitlist
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
            </a>
          )}
        </div>
      ) : req.aceableProductUrl ? (
        <div className="mt-8 text-center">
          <a
            href={req.aceableProductUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#DB306A] px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-[#C50B4A]"
          >
            Start Your {req.stateName} {req.lineOfAuthorityLabel} Course
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
          </a>
        </div>
      ) : null}

      {/* Links row */}
      <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm">
        {req.doiUrl && (
          <a
            href={req.doiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#169AA9] font-extrabold underline underline-offset-4 decoration-[1.5px] hover:text-[#197AA5]"
          >
            {req.stateName} Dept. of Insurance
          </a>
        )}
        {req.examProviderUrl && (
          <a
            href={req.examProviderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#169AA9] font-extrabold underline underline-offset-4 decoration-[1.5px] hover:text-[#197AA5]"
          >
            Schedule Your Exam
          </a>
        )}
        <button
          onClick={onStartOver}
          className="text-[#169AA9] font-extrabold underline underline-offset-4 decoration-[1.5px] hover:text-[#197AA5]"
        >
          Start Over
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function ChecklistCard({
  number,
  title,
  color,
  items,
}: {
  number: number;
  title: string;
  color: string;
  items: (string | null | undefined)[];
}) {
  const filtered = items.filter(Boolean) as string[];
  return (
    <div className="rounded-lg border-[1.5px] border-[#E8EEEF] bg-white p-5">
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {number}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-[#21333F]">{title}</h3>
          <ul className="mt-2 space-y-1.5">
            {filtered.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-[#436F6F]">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#2CE1AB]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[0.05em] text-[#12BDCD]">{label}</p>
      <p className="text-2xl font-extrabold text-white mt-1">{value}</p>
    </div>
  );
}
