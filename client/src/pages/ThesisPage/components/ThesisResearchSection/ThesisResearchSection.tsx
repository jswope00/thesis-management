import { IThesis, ThesisState } from '../../../../requests/responses/thesis'
import { Accordion, Center, Group, Stack, Text, NumberInput, Modal, Button } from '@mantine/core'
import { doRequest } from '../../../../requests/request'
import { showSimpleError, showSimpleSuccess } from '../../../../utils/notification'
import ConfirmationButton from '../../../../components/ConfirmationButton/ConfirmationButton'
import {
  useLoadedThesisContext,
  useThesisUpdateAction,
} from '../../../../providers/ThesisProvider/hooks'
import { ApiError, getApiResponseErrorMessage } from '../../../../requests/handler'
import { formatThesisFilename } from '../../../../utils/format'
import ThesisFeedbackRequestButton from '../ThesisFeedbackRequestButton/ThesisFeedbackRequestButton'
import ThesisFeedbackOverview from '../ThesisFeedbackOverview/ThesisFeedbackOverview'
import AuthenticatedFilePreview from '../../../../components/AuthenticatedFilePreview/AuthenticatedFilePreview'
import UploadFileButton from '../../../../components/UploadFileButton/UploadFileButton'
import FileHistoryTable from '../FileHistoryTable/FileHistoryTable'
import { checkMinimumThesisState, isThesisClosed } from '../../../../utils/thesis'
import { useState } from 'react'

const ThesisResearchSection = () => {
  const { thesis, access, updateThesis } = useLoadedThesisContext()
  const [gradeModalOpen, setGradeModalOpen] = useState(false)
  const [grade, setGrade] = useState<number | ''>('')

  const [accepting, onAccept] = useThesisUpdateAction(async () => {
    if (grade === '' || grade < 0 || grade > 100) {
      throw new Error('Please enter a valid grade between 0 and 100')
    }

    const response = await doRequest<IThesis>(`/v2/theses/${thesis.thesisId}/research/accept`, {
      method: 'PUT',
      requiresAuth: true,
      data: {
        grade: grade,
      },
    })

    if (response.ok) {
      setGradeModalOpen(false)
      setGrade('')
      return response.data
    } else {
      throw new ApiError(response)
    }
  }, 'Research Methods accepted successfully')

  const onUpload = async (file: File) => {
    const formData = new FormData()

    formData.append('research', file)

    const response = await doRequest<IThesis>(`/v2/theses/${thesis.thesisId}/research`, {
      method: 'POST',
      requiresAuth: true,
      formData: formData,
    })

    if (response.ok) {
      showSimpleSuccess('Research Methods uploaded successfully')

      updateThesis(response.data)
    } else {
      showSimpleError(getApiResponseErrorMessage(response))
    }
  }

  if (!checkMinimumThesisState(thesis, ThesisState.RESEARCH)) {
    return <></>
  }

  const research = thesis.research[0]

  return (
    <>
      <Accordion
        variant='separated'
        defaultValue={thesis.state === ThesisState.RESEARCH ? 'open' : ''}
      >
        <Accordion.Item value='open'>
          <Accordion.Control>Research Methods</Accordion.Control>
          <Accordion.Panel>
            <Stack>
              {research ? (
                <>
                  {research.grade && (
                    <Group justify='center' mb='md'>
                      <Text size='lg' fw={600} c='green'>
                        Grade: {research.grade}/100
                      </Text>
                    </Group>
                  )}
                  <AuthenticatedFilePreview
                    url={`/v2/theses/${thesis.thesisId}/research/${research.researchId}`}
                    filename={formatThesisFilename(
                      thesis,
                      'Research Methods',
                      research.filename,
                      thesis.research.length,
                    )}
                    type='any'
                    aspectRatio={16 / 6}
                    actionButton={
                      ((access.student && thesis.state === ThesisState.RESEARCH) || access.advisor) &&
                      !isThesisClosed(thesis) ? (
                        <UploadFileButton
                          onUpload={onUpload}
                          maxSize={25 * 1024 * 1024}
                          accept='document'
                          ml='auto'
                        >
                          Upload Research Methods
                        </UploadFileButton>
                      ) : undefined
                    }
                    key={research.researchId}
                  />
                </>
              ) : (
                <Stack>
                  <Text ta='center'>No research methods uploaded yet</Text>
                  <Center>
                    <UploadFileButton onUpload={onUpload} maxSize={25 * 1024 * 1024} accept='document'>
                      Upload Research Methods
                    </UploadFileButton>
                  </Center>
                </Stack>
              )}
              <ThesisFeedbackOverview
                type='RESEARCH'
                allowEdit={thesis.state === ThesisState.RESEARCH}
              />
              {access.student && (
                <FileHistoryTable
                  data={thesis.research.map((row, index) => ({
                    filename: formatThesisFilename(
                      thesis,
                      'Research Methods',
                      row.filename,
                      thesis.research.length - index,
                    ),
                    url: `/v2/theses/${thesis.thesisId}/research/${row.researchId}`,
                    type: 'any',
                    uploadedBy: row.createdBy,
                    uploadedAt: row.createdAt,
                    name: `Research Methods v${thesis.research.length - index}`,
                    onDelete:
                      access.advisor && !isThesisClosed(thesis)
                        ? async () => {
                            const response = await doRequest<IThesis>(
                              `/v2/theses/${thesis.thesisId}/research/${row.researchId}`,
                              {
                                method: 'DELETE',
                                requiresAuth: true,
                              },
                            )

                            if (response.ok) {
                              updateThesis(response.data)
                            } else {
                              showSimpleError(getApiResponseErrorMessage(response))
                            }
                          }
                        : undefined,
                  }))}
                />
              )}
              <Group ml='auto'>
                {research && access.advisor && thesis.state === ThesisState.RESEARCH && (
                  <ThesisFeedbackRequestButton type='RESEARCH' />
                )}
                {access.advisor && thesis.state === ThesisState.RESEARCH && (
                  <Button
                    variant='outline'
                    color='green'
                    loading={accepting}
                    disabled={!research}
                    onClick={() => setGradeModalOpen(true)}
                  >
                    Accept Research Methods
                  </Button>
                )}
              </Group>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Modal
        opened={gradeModalOpen}
        onClose={() => setGradeModalOpen(false)}
        title='Accept Research Methods'
        size='sm'
      >
        <Stack>
          <Text size='sm'>
            Please provide a grade for this Research Methods document. The grade is required to accept the research.
          </Text>
          <NumberInput
            label='Grade'
            placeholder='Enter grade (0-100)'
            min={0}
            max={100}
            value={grade}
            onChange={(value) => setGrade(value as number | '')}
            required
          />
          {research?.grade && (
            <Text size='sm' c='dimmed'>
              Previous grade: {research.grade}/100
            </Text>
          )}
          <Group justify='flex-end'>
            <Button variant='outline' onClick={() => setGradeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color='green'
              loading={accepting}
              disabled={grade === '' || grade < 0 || grade > 100}
              onClick={onAccept}
            >
              Accept with Grade
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

export default ThesisResearchSection
