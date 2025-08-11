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
import { isThesisClosed } from '../../../../utils/thesis'
import { useState } from 'react'

const ThesisProposalSection = () => {
  const { thesis, access, updateThesis } = useLoadedThesisContext()
  const [gradeModalOpen, setGradeModalOpen] = useState(false)
  const [grade, setGrade] = useState<number | ''>('')

  const [accepting, onAccept] = useThesisUpdateAction(async () => {
    if (grade === '' || grade < 0 || grade > 100) {
      throw new Error('Please enter a valid grade between 0 and 100')
    }

    const response = await doRequest<IThesis>(`/v2/theses/${thesis.thesisId}/proposal/accept`, {
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
  }, 'CILE Introduction accepted successfully')

  const onUpload = async (file: File) => {
    const formData = new FormData()

    formData.append('proposal', file)

    const response = await doRequest<IThesis>(`/v2/theses/${thesis.thesisId}/proposal`, {
      method: 'POST',
      requiresAuth: true,
      formData: formData,
    })

    if (response.ok) {
      showSimpleSuccess('Proposal uploaded successfully')

      updateThesis(response.data)
    } else {
      showSimpleError(getApiResponseErrorMessage(response))
    }
  }

  const proposal = thesis.proposals[0]

    return (
    <>
      <Accordion
        variant='separated'
        defaultValue={thesis.state === ThesisState.PROPOSAL ? 'open' : ''}
      >
        <Accordion.Item value='open'>
          <Accordion.Control>CILE Introduction</Accordion.Control>
          <Accordion.Panel>
            <Stack>
              {proposal ? (
                <>
                  {proposal.grade && (
                    <Group justify='center' mb='md'>
                      <Text size='lg' fw={600} c='green'>
                        Grade: {proposal.grade}/100
                      </Text>
                    </Group>
                  )}
                  <AuthenticatedFilePreview
                    url={`/v2/theses/${thesis.thesisId}/proposal/${proposal.proposalId}`}
                    filename={formatThesisFilename(
                      thesis,
                      'CILE Introduction',
                      proposal.filename,
                      thesis.proposals.length,
                    )}
                    type='pdf'
                    aspectRatio={16 / 6}
                    actionButton={
                      ((access.student && thesis.state === ThesisState.PROPOSAL) || access.advisor) &&
                      !isThesisClosed(thesis) ? (
                        <UploadFileButton
                          onUpload={onUpload}
                          maxSize={25 * 1024 * 1024}
                          accept='pdf'
                          ml='auto'
                        >
                          Upload CILE Introduction
                        </UploadFileButton>
                      ) : undefined
                    }
                    key={proposal.proposalId}
                  />
                </>
              ) : (
                <Stack>
                  <Text ta='center'>No introduction uploaded yet</Text>
                  <Center>
                    <UploadFileButton onUpload={onUpload} maxSize={25 * 1024 * 1024} accept='pdf'>
                      Upload CILE Introduction
                    </UploadFileButton>
                  </Center>
                </Stack>
              )}
              <ThesisFeedbackOverview
                type='PROPOSAL'
                allowEdit={thesis.state === ThesisState.PROPOSAL}
              />
              {access.student && (
                <FileHistoryTable
                  data={thesis.proposals.map((row, index) => ({
                    filename: formatThesisFilename(
                      thesis,
                      'Final CILE Introduction',
                      row.filename,
                      thesis.proposals.length - index,
                    ),
                    url: `/v2/theses/${thesis.thesisId}/proposal/${row.proposalId}`,
                    type: 'pdf',
                    uploadedBy: row.createdBy,
                    uploadedAt: row.createdAt,
                    name: `CILE Introduction v${thesis.proposals.length - index}`,
                    onDelete:
                      access.advisor && !isThesisClosed(thesis)
                        ? async () => {
                            const response = await doRequest<IThesis>(
                              `/v2/theses/${thesis.thesisId}/proposal/${row.proposalId}`,
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
                {proposal && access.advisor && thesis.state === ThesisState.PROPOSAL && (
                  <ThesisFeedbackRequestButton type='PROPOSAL' />
                )}
                {access.advisor && thesis.state === ThesisState.PROPOSAL && (
                  <Button
                    variant='outline'
                    color='green'
                    loading={accepting}
                    disabled={!proposal}
                    onClick={() => setGradeModalOpen(true)}
                  >
                    Accept CILE Introduction
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
        title='Accept CILE Introduction'
        size='sm'
      >
        <Stack>
          <Text size='sm'>
            Please provide a grade for this CILE Introduction. The grade is required to accept the proposal.
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
          {proposal?.grade && (
            <Text size='sm' c='dimmed'>
              Previous grade: {proposal.grade}/100
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
 
 export default ThesisProposalSection
