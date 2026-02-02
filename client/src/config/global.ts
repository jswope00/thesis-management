import { IGlobalConfig } from './types'

const getEnvironmentVariable = <T = string>(key: string, useJson = false): T | undefined => {
  const value = process.env[key] || window.RUNTIME_ENVIRONMENT_VARIABLES?.[key]

  if (!value) {
    return undefined
  }

  try {
    return useJson ? (JSON.parse(value) as T) : (value as T)
  } catch {
    return undefined
  }
}

const generateTermOptions = () => {
  const currentYear = new Date().getFullYear()
  const terms = ['Fall', 'Summer', 'Spring']
  const years = [currentYear, currentYear - 1, currentYear - 2]
  const options: Record<string, string> = {}
  
  years.forEach(year => {
    terms.forEach(term => {
      options[`${term.toUpperCase()}_${year}`] = `${term} ${year}`
    })
  })
  
  return options
}

const generateGraduationYears = () => {
  const currentYear = new Date().getFullYear()
  const years: Record<string, string> = {}
  
  for (let i = 0; i < 6; i++) {
    const year = currentYear + i
    years[year.toString()] = year.toString()
  }
  
  return years
}

export const GLOBAL_CONFIG: IGlobalConfig = {
  title: getEnvironmentVariable('APPLICATION_TITLE') || 'CILE Management',

  chair_name: getEnvironmentVariable('CHAIR_NAME') || 'CILE Management',
  chair_url: getEnvironmentVariable('CHAIR_URL') || window.origin,

  allow_suggested_topics: (getEnvironmentVariable('ALLOW_SUGGESTED_TOPICS') || 'true') === 'true',

  genders: getEnvironmentVariable<Record<string, string>>('GENDERS', true) || {
    MALE: 'Male',
    FEMALE: 'Female',
    OTHER: 'Other',
    PREFER_NOT_TO_SAY: 'Prefer not to say',
  },


  graduation_years: getEnvironmentVariable<Record<string, string>>('GRADUATION_YEARS', true) || generateGraduationYears(),

  study_degrees: getEnvironmentVariable<Record<string, string>>('STUDY_DEGREES', true) || {
    BACHELOR: 'Bachelor',
    MASTER: 'Master',
  },

  study_programs: getEnvironmentVariable<Record<string, string>>('INCOMING_TERMS', true) || generateTermOptions(),

  thesis_types: getEnvironmentVariable<IGlobalConfig['thesis_types']>('THESIS_TYPES', true) || {
    NARRATIVE_REVIEW: {
      long: 'Narrative Review',
      short: 'NR',
    },
    GRANT_PROPOSAL: {
      long: 'Grant Proposal',
      short: 'GP',
    },
    POLICY_ANALYSIS: {
      long: 'Policy Analysis',
      short: 'PA',
    },
    CASE_REPORTS: {
      long: 'Case Reports',
      short: 'CR',
    },
    ORIGINAL_RESEARCH: {
      long: 'Original Research',
      short: 'OR',
    },
    OTHER: {
      long: 'Other',
      short: 'OT',
    },
  },

  languages: getEnvironmentVariable<Record<string, string>>('LANGUAGES', true) || {
    ENGLISH: 'English'
  },

  topic_views_options: getEnvironmentVariable<Record<string, string>>('TOPIC_VIEWS_OPTIONS', true) || {
    ALL: 'All Topics',
    MY_RESEARCH_GROUP: 'My Research Group',
    MY_TOPICS: 'My Topics',
  },

  research_groups_location: getEnvironmentVariable<Record<string, string>>('RESEARCH_GROUPS_LOCATION', true) || {
    DEFAULT: 'Default Location',
  },

  custom_data: getEnvironmentVariable<IGlobalConfig['custom_data']>('CUSTOM_DATA', true) || {
    PUBH831_Faculty: {
      label: 'PUBH831 Faculty',
      required: false,
    },
  },

  thesis_files: getEnvironmentVariable<IGlobalConfig['thesis_files']>('THESIS_FILES', true) || {
    ORAL_PRESENTATION: {
      label: 'Oral Presentation',
      description: 'Oral Presentation (Link to video presentation)',
      accept: 'any',
      required: false,
    }
  },

  default_supervisors: getEnvironmentVariable('DEFAULT_SUPERVISOR_UUID')?.split(';') || [],
  calendar_url: getEnvironmentVariable('CALDAV_URL') || '',
  server_host: getEnvironmentVariable('SERVER_HOST') || 'http://localhost:8080',

  keycloak: {
    host: getEnvironmentVariable('KEYCLOAK_EXTERNAL_HOST') || 'http://localhost:8081',
    realm: getEnvironmentVariable('KEYCLOAK_REALM_NAME') || 'thesis-management',
    client_id: getEnvironmentVariable('KEYCLOAK_CLIENT_ID') || 'thesis-management-app',
  },
}
