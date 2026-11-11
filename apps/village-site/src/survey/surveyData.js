// apps/village-site/src/survey/surveyData.js
// Community survey content (from the council's survey drafts) and settings.
//
// Question types:
//   single  one choice          multi  several choices (optional max, optional "Other" with write-in)
//   grid    rate each item 1-5  scale  one 1-5 rating  text  free text (short: single line)
// Questions that appear in both versions share the same id so results can be combined.

export const SURVEY_ID = 'community-2026'   // must match CurrentSurveyId in the API

// Last day to respond, as 'YYYY-MM-DD'. null = no deadline shown. The banner, home promo and
// survey close automatically the day after this date.
export const SURVEY_DEADLINE = null

// 'choice' lets residents pick either survey; 'full' or 'quick' shows just one.
export const SURVEY_MODE = 'choice'

export const CONFIRMATION = 'Thank you for taking the time to share your thoughts! Results will be shared at an upcoming council meeting.'

export const RATING_LEGEND = ['Not a priority', 'Low', 'Moderate', 'High', 'Top priority']

const HEAR_OPTIONS = [
  'Village website',
  'Village Facebook page or social media',
  'Newsletter or mailer',
  'Notices posted around the village',
]
const VOLUNTEER_OPTIONS = ['Yes', 'Maybe, tell me more', 'Not at this time']
const CONTACT_PROMPT = "If you'd like to volunteer or hear back from the council, leave your name and phone or email. (Optional)"

export const SURVEYS = {
  quick: {
    version: 'quick',
    label: 'Quick Survey',
    time: 'About 5 minutes',
    title: 'Village Community Survey: 5 Minutes to Shape Our Village',
    description: 'The Village Council wants to know what matters most to you. This short survey takes about 5 minutes.',
    sections: [
      {
        title: null,
        questions: [
          {
            id: 'focus', type: 'multi', max: 3,
            q: 'Which areas should the village focus on most? Pick up to 3.',
            options: [
              'Streets, potholes, and sidewalks',
              'Water and sewer systems',
              'Street lighting and traffic safety',
              'Snow and ice removal',
              'Parks, playground, and trails',
              'Community events',
              'Village appearance and beautification',
              'Property upkeep and nuisance enforcement',
              'Keeping taxes and utility rates low',
              'Grants and long-term planning',
              'Attracting small businesses or new housing',
              'Better communication from the village',
            ],
            other: true,
          },
          { id: 'satisfaction', type: 'scale', q: 'Overall, how satisfied are you with village services?', low: 'Very dissatisfied', high: 'Very satisfied' },
          { id: 'spend25k', type: 'text', q: 'If the village received an unexpected $25,000, how would you want it spent?' },
          { id: 'change', type: 'text', q: 'If you could change one thing about the village, what would it be?' },
          { id: 'hear', type: 'multi', q: 'How do you usually hear about village news and events? (Select all that apply)', options: [...HEAR_OPTIONS, 'Neighbors and word of mouth'], other: true },
          { id: 'volunteer', type: 'single', q: 'Would you be interested in volunteering for village events or committees?', options: VOLUNTEER_OPTIONS },
          { id: 'comments', type: 'text', q: 'Any other comments or ideas for the council?' },
          { id: 'contact', type: 'text', short: true, q: CONTACT_PROMPT },
        ],
      },
    ],
  },

  full: {
    version: 'full',
    label: 'Full Survey',
    time: 'About 10-15 minutes',
    title: 'Village Community Priorities Survey',
    description: "The Village Council wants to hear from you! This survey takes about 10-15 minutes and helps council decide where to focus the village's time and money over the next 1-2 years.",
    sections: [
      {
        title: 'Part 1: About You',
        note: 'Optional',
        questions: [
          { id: 'years', type: 'single', q: 'How long have you lived in the village?', options: ['Less than 2 years', '2–5 years', '6–10 years', '11–20 years', 'More than 20 years', "I don't live in the village"] },
          { id: 'who', type: 'single', q: 'Which best describes you?', options: ['I own my home in the village', 'I rent in the village', 'I own a business or property here but live elsewhere', 'Prefer not to say'] },
          { id: 'age', type: 'single', q: 'What is your age range?', options: ['Under 18', '18–34', '35–49', '50–64', '65 or older', 'Prefer not to say'] },
          { id: 'hear', type: 'multi', q: 'How do you usually hear about village news and events? (Select all that apply)', options: [...HEAR_OPTIONS, 'Attending council meetings', 'Neighbors and word of mouth'], other: true },
        ],
      },
      {
        title: 'Part 2: Rate the Priorities',
        note: 'For each item, choose how important it is to you, from 1 (not a priority) to 5 (top priority).',
        questions: [
          {
            id: 'infra', type: 'grid', q: 'Infrastructure: how important is each item to you?',
            items: [
              'Street paving and pothole repair',
              'Sidewalk repair or new sidewalks',
              'Water system (lines, wells, tower, water quality)',
              'Sewer or septic system needs',
              'Street lighting',
              'Snow and ice removal',
              'Street signs and traffic safety',
              'Village-owned buildings (hall, garage, maintenance)',
              'Broadband / internet access',
            ],
          },
          {
            id: 'parks', type: 'grid', q: 'Parks & Community: how important is each item to you?',
            items: [
              'Park maintenance (mowing, trees, upkeep)',
              'Playground equipment upgrades or safety',
              'Shelter house, restrooms, or picnic areas',
              'Walking paths or trails',
              'Community events (festivals, holiday events)',
              'Volunteer opportunities for events and committees',
              'Village beautification (flowers, banners, entry signs)',
              'Communication from the village (newsletter, website, social media)',
              'Property upkeep and nuisance enforcement',
            ],
          },
          {
            id: 'growth', type: 'grid', q: 'Growth & Budget: how important is each item to you?',
            items: [
              'Pursuing state and federal grants',
              'Building a reserve / rainy-day fund',
              'Keeping taxes and utility rates low',
              'Long-term planning for equipment, roads, and buildings',
              'Attracting small businesses',
              'New housing or residential growth',
              'Updating zoning or village ordinances',
              'Sharing services with the township, county, or nearby villages',
              'Fire, EMS, and police coverage',
              'Clear reporting on how village money is spent',
            ],
          },
        ],
      },
      {
        title: 'Part 3: Your Ideas',
        questions: [
          { id: 'top3', type: 'text', q: 'Of everything above, which three matter most to you, and why?' },
          { id: 'spend25k', type: 'text', q: 'If the village received an unexpected $25,000, how would you want it spent?' },
          { id: 'likeMost', type: 'text', q: 'What do you like most about living in our village?' },
          { id: 'change', type: 'text', q: 'If you could change one thing about the village, what would it be?' },
          { id: 'satisfaction', type: 'scale', q: 'Overall, how satisfied are you with village services?', low: 'Very dissatisfied', high: 'Very satisfied' },
          { id: 'volunteer', type: 'single', q: 'Would you be interested in volunteering for village events or committees?', options: VOLUNTEER_OPTIONS },
          { id: 'comments', type: 'text', q: 'Any other comments or ideas for the council?' },
          { id: 'contact', type: 'text', short: true, q: CONTACT_PROMPT },
        ],
      },
    ],
  },
}

export const questionCount = (survey) => survey.sections.reduce((n, s) => n + s.questions.length, 0)

// ─── Open / closed ───────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0')
const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export const isSurveyOpen = () => !SURVEY_DEADLINE || todayISO() <= SURVEY_DEADLINE

export function deadlineText() {
  if (!SURVEY_DEADLINE) return ''
  const d = new Date(`${SURVEY_DEADLINE}T12:00:00`)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}