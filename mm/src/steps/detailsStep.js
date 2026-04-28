// mm/src/steps/detailsStep.js
// mm/src/steps/detailsStep.js
import React from 'react';
import { useWorkflow } from '../store/workflowContext';

const AGE_OPTIONS = [
  'Children (0-12)',
  'Young Adult (13-17)',
  'New Adult (18-25)',
  'Adult (26-64)',
  'Senior (65+)',
  'All Ages',
];

const DEMO_OPTIONS = [
  'Men',
  'Women',
  'Non-binary/Gender diverse',
  'Parents',
  'Students',
  'Professionals',
  'Retirees',
  'Book club members',
  'Genre enthusiasts',
  'First-time readers',
  'Avid readers',
];

const CHANNELS = [
  'Amazon KDP',
  'IngramSpark',
  'Apple Books',
  'Barnes & Noble',
  'Kobo',
  'Draft2Digital',
  'Independent Bookstores',
  'Direct Sales',
];

const EXPERIENCE = [
  'First time author',
  'Published 1 - 3 books',
  'Established author (4+ books)',
  'Professional writer',
];

const ALL_AGES = 'All Ages';

// ---------------- UI atoms ----------------

const Pill = ({ selected, children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      'px-3 py-1 rounded-full border text-sm',
      selected
        ? 'border-blue-600 text-blue-700 bg-blue-50'
        : 'border-slate-200 text-slate-700 bg-white',
    ].join(' ')}
  >
    {children}
  </button>
);

const Section = ({ title, children }) => (
  <div className="border rounded-xl p-6 bg-white">
    <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
    <div className="mt-6">{children}</div>
  </div>
);

const Label = ({ children, required }) => (
  <label className="block text-sm font-medium text-slate-700">
    {children} {required ? <span className="text-red-500">*</span> : null}
  </label>
);

const Input = (props) => (
  <input
    {...props}
    className={['mt-2 w-full border rounded-md px-3 py-2', props.className || ''].join(' ')}
  />
);

const Select = (props) => (
  <select
    {...props}
    className={['mt-2 w-full border rounded-md px-3 py-2', props.className || ''].join(' ')}
  />
);

const Textarea = (props) => (
  <textarea
    {...props}
    className={['mt-2 w-full border rounded-md px-3 py-2', props.className || ''].join(' ')}
  />
);

// ---------------- component ----------------

const DetailsStep = () => {
  const { details, setDetails } = useWorkflow();

  // Ensure contributors is always an array
  const contributors = Array.isArray(details?.contributors) ? details.contributors : [];

  const toggleFromArray = (key, value) => {
    const current = Array.isArray(details[key]) ? details[key] : [];
    const exists = current.includes(value);
    const next = exists ? current.filter((v) => v !== value) : [...current, value];
    setDetails({ ...details, [key]: next });
  };

  // Special rules for ageRanges + "All Ages"
  const toggleAge = (age) => {
    const current = Array.isArray(details.ageRanges) ? details.ageRanges : [];

    if (age === ALL_AGES) {
      setDetails({ ...details, ageRanges: [ALL_AGES] });
      return;
    }

    let next = current.filter((a) => a !== ALL_AGES);

    const exists = next.includes(age);
    next = exists ? next.filter((a) => a !== age) : [...next, age];

    if (next.length === 0) next = [ALL_AGES];

    setDetails({ ...details, ageRanges: next });
  };

  const toggleChannel = (channel) => toggleFromArray('distributionChannels', channel);
  const toggleDemo = (demo) => toggleFromArray('demographics', demo);

  const isAgeSelected = (age) => {
    const current = Array.isArray(details.ageRanges) ? details.ageRanges : [];
    return current.includes(age);
  };

  // CONTRIBUTORS: add / update / remove
  const addContributor = () => {
    const next = [
      ...contributors,
      {
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
        role: 'Contributor',
        firstName: '',
        lastName: '',
      },
    ];
    setDetails({ ...details, contributors: next });
  };

  const updateContributor = (id, patch) => {
    const next = contributors.map((c) => (c.id === id ? { ...c, ...patch } : c));
    setDetails({ ...details, contributors: next });
  };

  const removeContributor = (id) => {
    const next = contributors.filter((c) => c.id !== id);
    setDetails({ ...details, contributors: next });
  };

  return (
    <div className="space-y-6">
      {/* Author Information */}
      <Section title="Author Information">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label>Prefix</Label>
            <Input
              placeholder="Dr., Mr., Ms."
              value={details.prefix}
              onChange={(e) => setDetails({ ...details, prefix: e.target.value })}
            />
          </div>

          <div>
            <Label required>First Name</Label>
            <Input
              placeholder="First name"
              value={details.firstName}
              onChange={(e) => setDetails({ ...details, firstName: e.target.value })}
            />
          </div>

          <div>
            <Label>Middle Name</Label>
            <Input
              placeholder="Middle name"
              value={details.middleName}
              onChange={(e) => setDetails({ ...details, middleName: e.target.value })}
            />
          </div>

          <div>
            <Label required>Last Name</Label>
            <Input
              placeholder="Last name"
              value={details.lastName}
              onChange={(e) => setDetails({ ...details, lastName: e.target.value })}
            />
          </div>

          <div>
            <Label>Suffix</Label>
            <Input
              placeholder="Jr., Sr., III"
              value={details.suffix}
              onChange={(e) => setDetails({ ...details, suffix: e.target.value })}
            />
          </div>
        </div>

        {/* Contributors header */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            <Label>Contributors (Optional)</Label>
            <div className="text-xs text-slate-500 mt-1">
              Add co-authors, editors, illustrators, foreword writers, etc.
            </div>
          </div>

          <button
            type="button"
            onClick={addContributor}
            className="px-4 py-2 border rounded-md text-sm hover:bg-slate-50"
          >
            + Add Contributor
          </button>
        </div>

        {/* Contributors list */}
        {contributors.length > 0 ? (
          <div className="mt-4 space-y-3">
            {contributors.map((c) => (
              <div key={c.id} className="border rounded-lg p-4 bg-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-1">
                    <Label>Role</Label>
                    <Select
                      value={c.role || 'Contributor'}
                      onChange={(e) => updateContributor(c.id, { role: e.target.value })}
                    >
                      <option>Contributor</option>
                      <option>Co-Author</option>
                      <option>Editor</option>
                      <option>Illustrator</option>
                      <option>Translator</option>
                      <option>Foreword</option>
                      <option>Cover Designer</option>
                      <option>Other</option>
                    </Select>
                  </div>

                  <div className="md:col-span-1">
                    <Label>First Name</Label>
                    <Input
                      value={c.firstName || ''}
                      onChange={(e) => updateContributor(c.id, { firstName: e.target.value })}
                      placeholder="First"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <Label>Last Name</Label>
                    <Input
                      value={c.lastName || ''}
                      onChange={(e) => updateContributor(c.id, { lastName: e.target.value })}
                      placeholder="Last"
                    />
                  </div>

                  <div className="md:col-span-1 flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => removeContributor(c.id)}
                      className="px-3 py-2 text-sm border rounded-md bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Section>

      {/* Book Information */}
      <Section title="Book Information">
        <div>
          <Label>Subtitle (Optional)</Label>
          <Input
            placeholder="Enter subtitle"
            value={details.subtitle}
            onChange={(e) => setDetails({ ...details, subtitle: e.target.value })}
          />
        </div>

        <div className="mt-6">
          <Label>Book Description</Label>
          <Textarea
            rows={5}
            placeholder="Provide a compelling description of your book (minimum 20 characters)"
            value={details.description}
            onChange={(e) => setDetails({ ...details, description: e.target.value })}
          />
        </div>

        <div className="mt-6">
          <Label>Primary Language</Label>
          <Select
            value={details.primaryLanguage}
            onChange={(e) => setDetails({ ...details, primaryLanguage: e.target.value })}
          >
            <option>English</option>
            <option>Spanish</option>
            <option>French</option>
            <option>German</option>
            <option>Italian</option>
          </Select>
        </div>
      </Section>

      {/* Target Audience */}
      <Section title="Target Audience">
        <div>
          <Label required>Age Range</Label>
          <div className="mt-3 flex flex-wrap gap-2">
            {AGE_OPTIONS.map((opt) => (
              <Pill key={opt} selected={isAgeSelected(opt)} onClick={() => toggleAge(opt)}>
                {opt}
              </Pill>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Label required>Demographics</Label>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEMO_OPTIONS.map((opt) => (
              <Pill
                key={opt}
                selected={Array.isArray(details.demographics) && details.demographics.includes(opt)}
                onClick={() => toggleDemo(opt)}
              >
                {opt}
              </Pill>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Label>Market Positioning</Label>
          <Textarea
            rows={4}
            placeholder="How do you want to position your book in the market?"
            value={details.marketPositioning}
            onChange={(e) => setDetails({ ...details, marketPositioning: e.target.value })}
          />
        </div>
      </Section>

      {/* Publishing Goals */}
      <Section title="Publishing Goals">
        <div>
          <Label required>Distribution Channels</Label>
          <div className="mt-3 flex flex-wrap gap-2">
            {CHANNELS.map((c) => (
              <Pill
                key={c}
                selected={Array.isArray(details.distributionChannels) && details.distributionChannels.includes(c)}
                onClick={() => toggleChannel(c)}
              >
                {c}
              </Pill>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <Label>Publishing Timeline</Label>
          <Input
            placeholder="e.g., Within 3 months, By end of year"
            value={details.publishingTimeline}
            onChange={(e) => setDetails({ ...details, publishingTimeline: e.target.value })}
          />
        </div>

        <div className="mt-6">
          <Label>Author Experience Level</Label>
          <Select
            value={details.authorExperienceLevel}
            onChange={(e) => setDetails({ ...details, authorExperienceLevel: e.target.value })}
          >
            <option value="">Select your experience level</option>
            {EXPERIENCE.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </Select>
        </div>
      </Section>

      {/* Additional Information */}
      <Section title="Additional Information (Optional)">
        <div>
          <Label>Series Information</Label>
          <Textarea
            rows={4}
            placeholder="Is this part of a series? Provide details about the series..."
            value={details.seriesInformation}
            onChange={(e) => setDetails({ ...details, seriesInformation: e.target.value })}
          />
        </div>

        <div className="mt-6">
          <Label>Branding Preferences</Label>
          <Textarea
            rows={4}
            placeholder="Any specific branding or design preferences for your book?"
            value={details.brandingPreferences}
            onChange={(e) => setDetails({ ...details, brandingPreferences: e.target.value })}
          />
        </div>

        <div className="mt-6">
          <Label>Marketing Objectives</Label>
          <Textarea
            rows={4}
            placeholder="What are your main goals for this book? (sales targets, audience building, etc.)"
            value={details.marketingObjectives}
            onChange={(e) => setDetails({ ...details, marketingObjectives: e.target.value })}
          />
        </div>
      </Section>
    </div>
  );
};

export default DetailsStep;
