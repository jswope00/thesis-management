import { IThesis, ThesisState } from '../../../../requests/responses/thesis'
import { Accordion, Anchor, Button, Center, Grid, Group, Stack, Text, Table, TextInput } from '@mantine/core'
import ConfirmationButton from '../../../../components/ConfirmationButton/ConfirmationButton'
import { doRequest } from '../../../../requests/request'
import { checkMinimumThesisState, isThesisClosed } from '../../../../utils/thesis'
import {
  useLoadedThesisContext,
  useThesisUpdateAction,
} from '../../../../providers/ThesisProvider/hooks'
import { showSimpleError, showSimpleSuccess } from '../../../../utils/notification'
import ThesisCommentsForm from '../../../../components/ThesisCommentsForm/ThesisCommentsForm'
import ThesisCommentsProvider from '../../../../providers/ThesisCommentsProvider/ThesisCommentsProvider'
import ThesisCommentsList from '../../../../components/ThesisCommentsList/ThesisCommentsList'
import { ApiError, getApiResponseErrorMessage } from '../../../../requests/handler'
import { formatDate, formatThesisFilename } from '../../../../utils/format'
import { GLOBAL_CONFIG } from '../../../../config/global'
import UploadFileButton from '../../../../components/UploadFileButton/UploadFileButton'
import AuthenticatedFilePreview from '../../../../components/AuthenticatedFilePreview/AuthenticatedFilePreview'
import AuthenticatedFileDownloadButton from '../../../../components/AuthenticatedFileDownloadButton/AuthenticatedFileDownloadButton'
import AuthenticatedFilePreviewButton from '../../../../components/AuthenticatedFilePreviewButton/AuthenticatedFilePreviewButton'
import { DownloadSimple, Eye, UploadSimple } from 'phosphor-react'
import FileHistoryTable from '../FileHistoryTable/FileHistoryTable'
import { useState } from 'react'

const ThesisWritingSection = () => {
  const { thesis, access, updateThesis } = useLoadedThesisContext()

  const [oralPresentationLink, setOralPresentationLink] = useState(
    thesis.oralPresentationLink ?? '',
  )
  const [savingLink, setSavingLink] = useState(false)

  const onSaveOralPresentationLink = async () => {
    setSavingLink(true)
    const response = await doRequest<IThesis>(
      `/v2/theses/${thesis.thesisId}/thesis/oral-presentation-link`,
      {
        method: 'PUT',
        requiresAuth: true,
        data: { oralPresentationLink: oralPresentationLink || null },
      },
    )
    setSavingLink(false)

    if (response.ok) {
      showSimpleSuccess('Oral presentation link saved successfully')
      updateThesis(response.data)
    } else {
      showSimpleError(getApiResponseErrorMessage(response))
    }
  }

  const [submitting, onFinalSubmission] = useThesisUpdateAction(async () => {
    const response = await doRequest<IThesis>(
      `/v2/theses/${thesis.thesisId}/thesis/final-submission`,
      {
        method: 'PUT',
        requiresAuth: true,
      },
    )

    if (response.ok) {
      return response.data
    } else {
      throw new ApiError(response)
    }
  }, 'Final CILE Project submitted successfully')

  const onFileUpload = async (type: string, file: File) => {
    const formData = new FormData()

    formData.append('type', type)
    formData.append('file', file)

    const response = await doRequest<IThesis>(`/v2/theses/${thesis.thesisId}/files`, {
      method: 'POST',
      requiresAuth: true,
      formData: formData,
    })

    if (response.ok) {
      showSimpleSuccess('File uploaded successfully')
      updateThesis(response.data)
    } else {
      if (access.student && thesis.state === ThesisState.SUBMITTED) {
        // It is not possible to return this message in the endpoint, the client already catches that the student is not permitted to submit and returns a 403
        showSimpleError('Cannot upload files after final submission. Please contact your advisor.')
      } else {
        showSimpleError(getApiResponseErrorMessage(response))
      }
    }
  }

  if (!checkMinimumThesisState(thesis, ThesisState.WRITING)) {
    return <></>
  }

  const adjustedThesisFiles: typeof GLOBAL_CONFIG.thesis_files = {
    ...GLOBAL_CONFIG.thesis_files,
    THESIS: {
      label: 'CILE Final Submission',
      description: 'Thesis',
      accept: 'document',
      required: true,
    },
  }

  const thesisFile = thesis.files.find((file) => file.type === 'THESIS')
  const customFiles = Object.fromEntries(
    Object.keys(GLOBAL_CONFIG.thesis_files).map((type) => [
      type,
      thesis.files.find((file) => file.type === type),
    ]),
  )
  const requiredFilesUploaded =
    !!thesisFile &&
    !Object.entries(GLOBAL_CONFIG.thesis_files)
      .filter(([, value]) => value.required)
      .some(([key]) => !customFiles[key])

  return (
    <Accordion variant='separated' defaultValue='open'>
      <Accordion.Item value='open'>
        <Accordion.Control>Final CILE Project Submission</Accordion.Control>
        <Accordion.Panel>
          <Accordion variant='separated' defaultValue='thesis'>
            <Accordion.Item value='thesis'>
              <Accordion.Control>Files</Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  <Grid>
                    <Grid.Col span={{ xl: 12 }}>
                      <Stack>
                        {thesisFile ? (
                          <AuthenticatedFilePreview
                            key={thesisFile.filename}
                            url={`/v2/theses/${thesis.thesisId}/files/${thesisFile.fileId}`}
                            filename={formatThesisFilename(
                              thesis,
                              'Final CILE Project',
                              thesisFile.filename,
                              0,
                            )}
                            type='any'
                            aspectRatio={16 / 10}
                            actionButton={
                              ((access.student && thesis.state === ThesisState.WRITING) ||
                                access.advisor) &&
                              !isThesisClosed(thesis) ? (
                                <UploadFileButton
                                  maxSize={25 * 1024 * 1024}
                                  accept='document'
                                  onUpload={(file) => onFileUpload('THESIS', file)}
                                >
                                  Upload Final CILE Project
                                </UploadFileButton>
                              ) : undefined
                            }
                          />
                        ) : (
                          <Stack>
                            <Text ta='center'>No file uploaded yet</Text>
                            <Center>
                              <UploadFileButton
                                maxSize={25 * 1024 * 1024}
                                accept='document'
                                onUpload={(file) => onFileUpload('THESIS', file)}
                              >
                                Upload Final CILE Project
                              </UploadFileButton>
                            </Center>
                          </Stack>
                        )}
                      </Stack>
                    </Grid.Col>
                  </Grid>
                  {access.student && (
                    <FileHistoryTable
                      data={thesis.files
                        .filter((file) => adjustedThesisFiles[file.type])
                        .map((file, index) => ({
                          name:
                            adjustedThesisFiles[file.type].label +
                            ' v' +
                            thesis.files.filter((a, b) => b >= index && a.type === file.type)
                              .length,
                          url: `/v2/theses/${thesis.thesisId}/files/${file.fileId}`,
                          filename: formatThesisFilename(
                            thesis,
                            adjustedThesisFiles[file.type].label,
                            file.filename,
                            thesis.files.filter((a, b) => b >= index && a.type === file.type)
                              .length,
                          ),
                          type: adjustedThesisFiles[file.type].accept,
                          uploadedBy: file.uploadedBy,
                          uploadedAt: file.uploadedAt,
                          onDelete:
                            access.advisor && !isThesisClosed(thesis)
                              ? async () => {
                                  const response = await doRequest<IThesis>(
                                    `/v2/theses/${thesis.thesisId}/files/${file.fileId}`,
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
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value='oral-presentation'>
              <Accordion.Control>Oral Presentation Link</Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  {access.student && thesis.state === ThesisState.WRITING && !isThesisClosed(thesis) ? (
                    <Group align='flex-end'>
                      <TextInput
                        style={{ flex: 1 }}
                        label='Oral Presentation Link'
                        description='Provide a link to your oral presentation (e.g. a video recording or slides URL). This will be visible to faculty when they review your submission.'
                        placeholder='https://...'
                        value={oralPresentationLink}
                        onChange={(e) => setOralPresentationLink(e.currentTarget.value)}
                      />
                      <Button onClick={onSaveOralPresentationLink} loading={savingLink}>
                        Save Link
                      </Button>
                    </Group>
                  ) : (
                    <Stack gap='xs'>
                      <Text fw={500} size='sm'>Oral Presentation Link</Text>
                      {thesis.oralPresentationLink ? (
                        <Anchor href={thesis.oralPresentationLink} target='_blank' rel='noopener noreferrer'>
                          {thesis.oralPresentationLink}
                        </Anchor>
                      ) : (
                        <Text c='dimmed' size='sm'>No link provided yet.</Text>
                      )}
                    </Stack>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value='comments'>
              <Accordion.Control>Comments</Accordion.Control>
              <Accordion.Panel>
                <Stack>
                  <ThesisCommentsProvider limit={10} thesis={thesis} commentType='THESIS'>
                    <ThesisCommentsList />
                    {access.student && <ThesisCommentsForm />}
                  </ThesisCommentsProvider>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

          </Accordion>



          <Stack mt='md'>
            {access.student && thesis.state === ThesisState.WRITING && (
              <ConfirmationButton
                confirmationTitle='Final Submission'
                confirmationText='Are you sure you want to submit your project? This action cannot be undone.'
                ml='auto'
                onClick={onFinalSubmission}
                disabled={!requiredFilesUploaded}
                loading={submitting}
              >
                Mark Submission as Final
              </ConfirmationButton>
            )}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  )
}

export default ThesisWritingSection
