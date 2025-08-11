import { isEmail, isNotEmpty, useForm } from '@mantine/form'
import { IUpdateUserInformationPayload } from '../../requests/payloads/user'
import {
  Button,
  Group,
  Select,
  Stack,
  TextInput,
} from '@mantine/core'
import { useAuthenticationContext, useLoggedInUser } from '../../hooks/authentication'
import { GLOBAL_CONFIG } from '../../config/global'
import UploadArea from '../UploadArea/UploadArea'
import { useEffect, useState } from 'react'
import { useApiPdfFile } from '../../hooks/fetcher'
import { showSimpleError } from '../../utils/notification'
import { getHtmlTextLength } from '../../utils/validation'
import { enrollmentDateToSemester, semesterToEnrollmentDate } from '../../utils/converter'
import AvatarInput from './components/AvatarInput/AvatarInput'

interface IUserInformationFormProps {
  requireCompletion: boolean
  includeAvatar?: boolean
  onComplete?: () => unknown
}


const UserInformationForm = (props: IUserInformationFormProps) => {
  const { requireCompletion, includeAvatar, onComplete } = props

  const { updateInformation } = useAuthenticationContext()
  const user = useLoggedInUser()

  const form = useForm<
    Omit<IUpdateUserInformationPayload, 'enrolledAt'> & {
      graduationYear: string
      researchGroupName: string | null
      customData: Record<string, string>
      declarationOfConsentAccepted: boolean
      avatar: File | undefined
      cv: File | undefined
      degreeReport: File | undefined
    }
  >({
    mode: 'controlled',
    initialValues: {
      matriculationNumber: '',
      email: '',
      firstName: '',
      lastName: '',
      gender: '',
      nationality: '',
      studyProgram: '',
      graduationYear: '',
      researchGroupName: '',
      specialSkills: '',
      projects: '',
      interests: '',
      declarationOfConsentAccepted: localStorage.getItem('declarationOfConsentAccepted') === 'true',
      avatar: undefined,
      cv: undefined,
      degreeReport: undefined,
      customData: Object.fromEntries(
        Object.keys(GLOBAL_CONFIG.custom_data).map((key) => [key, '']),
      ),
    },
    validateInputOnBlur: true,
    validate: {
      matriculationNumber: requireCompletion
        ? isNotEmpty('Please state your A-Number')
        : undefined,
      firstName: requireCompletion ? isNotEmpty('Please state your first name') : undefined,
      lastName: requireCompletion ? isNotEmpty('Please state your last name') : undefined,
      email: requireCompletion ? isEmail('Invalid email') : undefined,
      studyProgram: requireCompletion ? isNotEmpty('Please select your study program') : undefined,
      graduationYear: requireCompletion ? isNotEmpty('Please select your expected graduation year') : undefined,
      ...Object.fromEntries(
        Object.entries(GLOBAL_CONFIG.custom_data)
          .filter(([, value]) => value.required)
          .map(([key, value]) => [
            `customData.${key}`,
            requireCompletion ? isNotEmpty(`Please state your ${value.label}`) : undefined,
          ]),
      ),
    },
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    form.setValues({
      email: user?.email || '',
      matriculationNumber: user?.matriculationNumber || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      gender: user?.gender || '',
      nationality: user?.nationality || '',
      studyProgram: user?.studyProgram || '',
      graduationYear: user?.enrolledAt ? enrollmentDateToSemester(user.enrolledAt).toString() : '',
      researchGroupName: user?.researchGroupName || '',
      specialSkills: user?.specialSkills || '',
      interests: user?.interests || '',
      projects: user?.projects || '',
      customData: Object.fromEntries(
        Object.keys(GLOBAL_CONFIG.custom_data).map((key) => [key, user.customData?.[key] || '']),
      ),
    })
  }, [user])

  useApiPdfFile(
    user.hasCv ? `/v2/users/${user.userId}/cv` : undefined,
    `cv-${user.userId}.pdf`,
    (file) => form.setFieldValue('cv', file),
  )
  useApiPdfFile(
    user.hasDegreeReport ? `/v2/users/${user.userId}/degree-report` : undefined,
    `degree-report-${user.userId}.pdf`,
    (file) => form.setFieldValue('degreeReport', file),
  )

  return (
    <form
      onSubmit={form.onSubmit(async (values) => {
        setLoading(true)

        localStorage.setItem('declarationOfConsentAccepted', 'true')

        try {
          await updateInformation(
            {
              matriculationNumber: values.matriculationNumber || null,
              firstName: values.firstName || null,
              lastName: values.lastName || null,
              gender: values.gender || null,
              nationality: values.nationality || null,
              email: values.email || null,
              studyProgram: values.studyProgram || null,
              enrolledAt: semesterToEnrollmentDate(values.graduationYear),
              specialSkills: values.specialSkills || null,
              interests: values.interests || null,
              projects: values.projects || null,
              customData: values.customData,
            },
            values.avatar,
            undefined,
            values.cv,
            values.degreeReport,
          )
            .then(onComplete)
            .catch((e) => {
              if (e instanceof Error) {
                showSimpleError(e.message)
              }
            })
        } finally {
          setLoading(false)
        }
      })}
    >
      <Stack gap='md'>
        {includeAvatar && (
          <AvatarInput
            label='Avatar'
            required={requireCompletion}
            value={form.values.avatar}
            onChange={(file) => form.setFieldValue('avatar', file)}
          />
        )}
        <Group grow align='flex-start'>
          <TextInput
            type='email'
            required={requireCompletion}
            placeholder='your@email.com'
            label='Email'
            {...form.getInputProps('email')}
          />
          <TextInput
            type='text'
            required={requireCompletion}
            placeholder='A-Number'
            label='A-Number'
            {...form.getInputProps('matriculationNumber')}
          />
        </Group>
        <Group grow align='flex-start'>
          <TextInput
            type='text'
            required={requireCompletion}
            placeholder='First Name'
            label='First Name'
            {...form.getInputProps('firstName')}
          />
          <TextInput
            type='text'
            required={requireCompletion}
            placeholder='Last Name'
            label='Last Name'
            {...form.getInputProps('lastName')}
          />
        </Group>

        <Group grow align='flex-start'>
          <Select
            label='Incoming Term'
            placeholder='Select Incoming Term'
            data={Object.entries(GLOBAL_CONFIG.study_programs).map(([key, value]) => ({
              label: value,
              value: key,
            }))}
            required={requireCompletion}
            searchable={true}
            {...form.getInputProps('studyProgram')}
          />
          <Select
            label='Expected Graduation Year'
            placeholder='Select Graduation Year'
            data={Object.entries(GLOBAL_CONFIG.graduation_years).map(([key, value]) => ({
              label: value,
              value: key,
            }))}
            required={requireCompletion}
            searchable={true}
            {...form.getInputProps('graduationYear')}
          />
        </Group>
        {user?.researchGroupName && (
          <Select
            label='Research Group'
            data={[user.researchGroupName]}
            disabled
            {...form.getInputProps('researchGroupName')}
          />
        )}
        {Object.entries(GLOBAL_CONFIG.custom_data).map(([key, value]) => (
          <TextInput
            key={key}
            label={value.label}
            required={value.required && requireCompletion}
            {...form.getInputProps(`customData.${key}`)}
          />
        ))}

        <Group>
          <Button type='submit' ml='auto' disabled={!form.isValid()} loading={loading}>
            Update Information
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

export default UserInformationForm
