import { ITopic } from '../../../../requests/responses/topic'
import { isNotEmpty, useForm } from '@mantine/form'
import { Accordion, Button, Select, Stack, TextInput } from '@mantine/core'
import DocumentEditor from '../../../../components/DocumentEditor/DocumentEditor'
import { useEffect, useState } from 'react'
import { doRequest } from '../../../../requests/request'
import { showSimpleError } from '../../../../utils/notification'
import { getApiResponseErrorMessage } from '../../../../requests/handler'
import { DateInput, DateValue } from '@mantine/dates'
import { getHtmlTextLength } from '../../../../utils/validation'
import { GLOBAL_CONFIG } from '../../../../config/global'
import { IApplication } from '../../../../requests/responses/application'
import TopicAccordionItem from '../../../../components/TopicAccordionItem/TopicAccordionItem'
import { formatThesisType } from '../../../../utils/format'
import { PaginationResponse } from '../../../../requests/responses/pagination'
import { ILightResearchGroup } from '../../../../requests/responses/researchGroup'
import AdvisorSelect from '../../../../components/AdvisorSelect/AdvisorSelect'

interface IMotivationStepProps {
  topic: ITopic | undefined
  application: IApplication | undefined
  onComplete: () => unknown
}

interface IMotivationStepForm {
  thesisTitle: string
  researchGroupId: string
  facultyAdvisorId: string
  thesisType: string | null
  desiredStartDate: DateValue
  motivation: string
}

const MotivationStep = (props: IMotivationStepProps) => {
  const { topic, application, onComplete } = props

  const [researchGroups, setResearchGroups] = useState<PaginationResponse<ILightResearchGroup>>()
  const [loading, setLoading] = useState(false)

  const mergedTopic = application?.topic || topic

  const form = useForm<IMotivationStepForm>({
    mode: 'controlled',
    initialValues: {
      thesisTitle: '',
      researchGroupId: '',
      facultyAdvisorId: '',
      thesisType: null,
      desiredStartDate: new Date(),
      motivation: '',
    },
    validateInputOnBlur: true,
    validate: {
      thesisTitle: (value) => {
        if (!mergedTopic && !value) {
          return 'Please state your suggested CILE Topic Title'
        }
      },
      researchGroupId: isNotEmpty('Please select a research group'),
      facultyAdvisorId: isNotEmpty('Please select a faculty advisor'),
      thesisType: isNotEmpty('Please state your CILE format'),
      desiredStartDate: isNotEmpty('Please state your desired start date'),
      motivation: (value) => {
        if (!value) {
          return 'Please submit a draft introduction for your CILE project.'
        } else if (getHtmlTextLength(value) > 10000) {
          return 'The maximum allowed number of characters is 10000'
        }
      },
    },
  })

  useEffect(() => {
    if (application) {
      form.setValues({
        motivation: application.motivation,
        desiredStartDate: new Date(application.desiredStartDate),
        thesisType: application.thesisType,
        thesisTitle: application.thesisTitle ?? '',
        researchGroupId: application.researchGroup.id,
        facultyAdvisorId: application.facultyAdvisor?.userId || '',
      })
    }
  }, [application?.applicationId])

  useEffect(() => {
    if (mergedTopic) {
      setResearchGroups({
        content: mergedTopic.researchGroup ? [mergedTopic.researchGroup] : [],
        totalPages: 1,
        totalElements: mergedTopic.researchGroup ? 1 : 0,
        last: true,
        pageNumber: 0,
        pageSize: -1,
      })
      form.setValues({ researchGroupId: mergedTopic.researchGroup.id })
      return
    }

    setLoading(true)
    return doRequest<PaginationResponse<ILightResearchGroup>>(
      '/v2/research-groups',
      {
        method: 'GET',
        requiresAuth: true,
        params: {
          page: 0,
          limit: -1,
        },
      },
      (res) => {
        if (res.ok) {
          setResearchGroups({
            ...res.data,
            content: res.data.content,
          })

          if (res.data.content.length === 1) {
            form.setValues({ researchGroupId: res.data.content[0].id })
          }
        } else {
          showSimpleError(getApiResponseErrorMessage(res))

          setResearchGroups({
            content: [],
            totalPages: 0,
            totalElements: 0,
            last: true,
            pageNumber: 0,
            pageSize: -1,
          })
        }
        setLoading(false)
      },
    )
  }, [mergedTopic])

  const onSubmit = async (values: IMotivationStepForm) => {
    setLoading(true)

    try {
      const response = await doRequest(
        application ? `/v2/applications/${application.applicationId}` : '/v2/applications',
        {
          method: application ? 'PUT' : 'POST',
          requiresAuth: true,
          data: {
            topicId: mergedTopic?.topicId,
            researchGroupId: values.researchGroupId,
            facultyAdvisorId: values.facultyAdvisorId,
            thesisTitle: values.thesisTitle || null,
            thesisType: values.thesisType,
            desiredStartDate: values.desiredStartDate,
            motivation: values.motivation,
          },
        },
      )

      if (response.ok) {
        onComplete()
      } else {
        showSimpleError(getApiResponseErrorMessage(response))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
      <Stack gap='md'>
        {mergedTopic ? (
          <Accordion variant='separated'>
            <TopicAccordionItem topic={mergedTopic} />
          </Accordion>
        ) : (
          <TextInput
            label='Suggested CILE Title'
            required={true}
            {...form.getInputProps('thesisTitle')}
          />
        )}
        <Select
          label='Research Group'
          required
          nothingFoundMessage={!loading ? 'Nothing found...' : 'Loading...'}
          disabled={!!mergedTopic}
          data={researchGroups?.content.map((researchGroup: ILightResearchGroup) => ({
            label: researchGroup.name,
            value: researchGroup.id,
          }))}
          {...form.getInputProps('researchGroupId')}
        />
        <AdvisorSelect
          value={form.values.facultyAdvisorId}
          onChange={(value) => form.setFieldValue('facultyAdvisorId', value)}
          required={true}
        />
        <Select
          label='CILE Format'
          required={true}
          data={(mergedTopic?.thesisTypes || Object.keys(GLOBAL_CONFIG.thesis_types)).map(
            (thesisType) => ({
              label: formatThesisType(thesisType),
              value: thesisType,
            }),
          )}
          {...form.getInputProps('thesisType')}
        />
        <DateInput
          label='Desired Start Date'
          required={true}
          {...form.getInputProps('desiredStartDate')}
        />
        <DocumentEditor
          label='Submit Draft CILE Introduction'
          required={true}
          editMode={true}
          maxLength={10000}
          {...form.getInputProps('motivation')}
        />
        <Button type='submit' ml='auto' disabled={!form.isValid()} loading={loading}>
          {application ? 'Update Application' : 'Submit Application'}
        </Button>
      </Stack>
    </form>
  )
}

export default MotivationStep
