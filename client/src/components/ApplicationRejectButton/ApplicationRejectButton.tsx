import { doRequest } from '../../requests/request'
import { ApplicationState, IApplication } from '../../requests/responses/application'
import { showSimpleError, showSimpleSuccess } from '../../utils/notification'
import { Button, Checkbox, Modal, Stack, Text, Textarea } from '@mantine/core'
import React, { useEffect, useState } from 'react'
import { ButtonProps } from '@mantine/core/lib/components/Button/Button'
import { useApplicationsContextUpdater } from '../../providers/ApplicationsProvider/hooks'
import { getApiResponseErrorMessage } from '../../requests/handler'
import { useForm } from '@mantine/form'

interface IApplicationRejectButtonProps extends ButtonProps {
  application: IApplication
  onUpdate: (application: IApplication) => unknown
}

interface IFormValues {
  notifyUser: boolean
  comment: string
  rejectAll: boolean
}

const ApplicationRejectButton = (props: IApplicationRejectButtonProps) => {
  const { application, onUpdate, ...buttonProps } = props

  const updateApplicationContext = useApplicationsContextUpdater()

  const [confirmationModal, setConfirmationModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<IFormValues>({
    mode: 'controlled',
    initialValues: {
      notifyUser: true,
      comment: '',
      rejectAll: false,
    },
  })

  useEffect(() => {
    form.reset()
  }, [confirmationModal])

  if (application.state !== ApplicationState.NOT_ASSESSED) {
    return <></>
  }

  const onReject = async (values: IFormValues) => {
    setLoading(true)

    try {
      const response = await doRequest<IApplication[]>(
        `/v2/applications/${application.applicationId}/reject`,
        {
          method: 'PUT',
          requiresAuth: true,
          data: {
            comment: values.comment || null,
            notifyUser: values.notifyUser,
            rejectAll: values.rejectAll,
          },
        },
      )

      if (response.ok) {
        showSimpleSuccess('Application rejected successfully')

        for (const item of response.data) {
          updateApplicationContext(item)
        }

        const currentApplication = response.data.find(
          (item) => item.applicationId === application.applicationId,
        )

        if (currentApplication) {
          onUpdate(currentApplication)
        }

        setConfirmationModal(false)
      } else {
        showSimpleError(getApiResponseErrorMessage(response))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      {...buttonProps}
      variant='outline'
      loading={loading}
      color='red'
      onClick={() => setConfirmationModal(true)}
    >
      <Modal
        title='Reject Application'
        opened={confirmationModal}
        onClick={(e) => e.stopPropagation()}
        onClose={() => setConfirmationModal(false)}
      >
        <form>
          <Stack>
            <Text>Please specify a reason why you want to reject the application</Text>
            <Textarea
              label='Rejection Comment'
              placeholder='Provide a reason or additional context for the student...'
              autosize
              minRows={3}
              maxRows={8}
              {...form.getInputProps('comment')}
            />
            <Checkbox
              label='Notify Student'
              required
              {...form.getInputProps('notifyUser', { type: 'checkbox' })}
            />
            <Button
              onClick={() => onReject(form.getValues())}
              loading={loading}
              fullWidth
            >
              Reject Application
            </Button>
          </Stack>
        </form>
      </Modal>
      Reject
    </Button>
  )
}

export default ApplicationRejectButton
