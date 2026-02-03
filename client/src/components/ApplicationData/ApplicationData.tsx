import { IApplication } from '../../requests/responses/application'
import { Stack, Group, Grid, Title, Badge, Accordion } from '@mantine/core'
import React, { ReactNode } from 'react'
import { GLOBAL_CONFIG } from '../../config/global'
import { AVAILABLE_COUNTRIES } from '../../config/countries'
import {
  formatApplicationFilename,
  formatApplicationState,
  formatDate,
  formatThesisType,
} from '../../utils/format'
import LabeledItem from '../LabeledItem/LabeledItem'
import DocumentEditor from '../DocumentEditor/DocumentEditor'
import { ApplicationStateColor } from '../../config/colors'
import TopicAccordionItem from '../TopicAccordionItem/TopicAccordionItem'
import { enrollmentDateToSemester } from '../../utils/converter'
import AuthenticatedFilePreview from '../AuthenticatedFilePreview/AuthenticatedFilePreview'

interface IApplicationDataProps {
  application: IApplication
  bottomSection?: ReactNode
  rightTitleSection?: ReactNode
}

const ApplicationData = (props: IApplicationDataProps) => {
  const { application, bottomSection, rightTitleSection } = props

  return (
    <Grid>
      <Grid.Col span={{ md: 8 }} py={0}>
        <Stack>
          <Group>
            <Title>
              {application.user.firstName} {application.user.lastName}
            </Title>
            {rightTitleSection}
          </Group>
          {application.topic ? (
            <Accordion variant='separated'>
              <TopicAccordionItem topic={application.topic} />
            </Accordion>
          ) : (
            <LabeledItem label='CILE Topic Title' value={application.thesisTitle} />
          )}
          <DocumentEditor label='Draft CILE Introduction' value={application.motivation} />
          <Grid>
            <Grid.Col span={{ xs: 4, sm: 3 }}>
              <LabeledItem
                label='Email'
                value={application.user.email}
                copyText={application.user.email || undefined}
              />
            </Grid.Col>
            {/* Gender and nationality columns hidden */}
            <Grid.Col span={{ xs: 4, sm: 3 }}>
              <LabeledItem
                label='University ID'
                value={application.user.universityId}
                copyText={application.user.universityId}
              />
            </Grid.Col>
            <Grid.Col span={{ xs: 4, sm: 3 }}>
              <LabeledItem
                label='A-Number'
                value={application.user.matriculationNumber}
                copyText={application.user.matriculationNumber || undefined}
              />
            </Grid.Col>

            <Grid.Col span={{ xs: 4, sm: 3 }}>
              <LabeledItem
                label='Incoming Term'
                value={
                  GLOBAL_CONFIG.study_programs[application.user.studyProgram || ''] ??
                  application.user.studyProgram
                }
              />
            </Grid.Col>
            <Grid.Col span={{ xs: 4, sm: 3 }}>
              <LabeledItem
                label='Expected Graduation'
                value={enrollmentDateToSemester(application.user.enrolledAt || '')}
              />
            </Grid.Col>

            <Grid.Col span={{ xs: 4, sm: 3 }}>
              <LabeledItem label='CILE Format' value={formatThesisType(application.thesisType)} />
            </Grid.Col>
            <Grid.Col span={{ xs: 4, sm: 3 }}>
              <LabeledItem
                label='Submission Date'
                value={formatDate(application.createdAt, { withTime: true })}
              />
            </Grid.Col>
            <Grid.Col span={{ xs: 4, sm: 3 }}>
              <LabeledItem
                label='State'
                value={
                  <Badge color={ApplicationStateColor[application.state]}>
                    {formatApplicationState(application.state)}
                  </Badge>
                }
              />
            </Grid.Col>
            {application.reviewedAt && (
              <Grid.Col span={{ xs: 4, sm: 3 }}>
                <LabeledItem
                  label='Reviewed At'
                  value={formatDate(application.reviewedAt, { withTime: true })}
                />
              </Grid.Col>
            )}
            {application.user.customData &&
              Object.entries(application.user.customData).map(([key, value]) => (
                <Grid.Col key={key} span={{ md: 6 }}>
                  <LabeledItem label={GLOBAL_CONFIG.custom_data[key]?.label ?? key} value={value} />
                </Grid.Col>
              ))}
          </Grid>
          {bottomSection}
        </Stack>
      </Grid.Col>
      <Grid.Col span={{ md: 4 }}>
        <Stack gap='md' key={application.applicationId}>
          {application.user.hasCv && (
            <AuthenticatedFilePreview
              url={`/v2/users/${application.user.userId}/cv`}
              filename={formatApplicationFilename(application, 'CV', 'file.pdf')}
              type='pdf'
              aspectRatio={16 / 11}
              key={application.user.userId}
            />
          )}
          {application.user.hasExaminationReport && (
            <AuthenticatedFilePreview
              url={`/v2/users/${application.user.userId}/examination-report`}
              filename={formatApplicationFilename(application, 'Examination Report', 'file.pdf')}
              type='pdf'
              aspectRatio={16 / 11}
              key={application.user.userId}
            />
          )}
          {application.user.hasDegreeReport && (
            <AuthenticatedFilePreview
              url={`/v2/users/${application.user.userId}/degree-report`}
              filename={formatApplicationFilename(application, 'Degree Report', 'file.pdf')}
              type='pdf'
              aspectRatio={16 / 11}
              key={application.user.userId}
            />
          )}
        </Stack>
      </Grid.Col>
    </Grid>
  )
}

export default ApplicationData
