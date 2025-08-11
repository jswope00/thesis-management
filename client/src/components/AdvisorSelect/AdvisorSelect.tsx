import { Select } from '@mantine/core'
import { useEffect, useState } from 'react'
import { doRequest } from '../../requests/request'
import { showSimpleError } from '../../utils/notification'
import { getApiResponseErrorMessage } from '../../requests/handler'
import { ILightUser } from '../../requests/responses/user'
import { PaginationResponse } from '../../requests/responses/pagination'

interface AdvisorSelectProps {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
}

const AdvisorSelect = ({
  value,
  onChange,
  label = 'Faculty Advisor',
  required = false,
  placeholder = 'Select Faculty Advisor',
  disabled = false,
}: AdvisorSelectProps) => {
  const [advisors, setAdvisors] = useState<ILightUser[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    
    doRequest<PaginationResponse<ILightUser>>(
      '/v2/users',
      {
        method: 'GET',
        requiresAuth: true,
        params: {
          groups: 'advisor,supervisor',
          page: 0,
          limit: 1000, // Get up to 1000 advisors
          sortBy: 'firstName',
          sortOrder: 'asc',
        },
      },
      (res) => {
        if (res.ok) {
          setAdvisors(res.data.content)
        } else {
          showSimpleError(getApiResponseErrorMessage(res))
          setAdvisors([])
        }
        setLoading(false)
      },
    )
  }, [])

  const formatAdvisorName = (advisor: ILightUser) => {
    const name = `${advisor.firstName || ''} ${advisor.lastName || ''}`.trim()
    return name || advisor.universityId || 'Unknown'
  }

  return (
    <Select
      label={label}
      placeholder={placeholder}
      required={required}
      disabled={disabled || loading}
      value={value}
      onChange={(val) => onChange(val || '')}
      data={advisors.map((advisor) => ({
        label: formatAdvisorName(advisor),
        value: advisor.userId,
      }))}
      nothingFoundMessage={loading ? 'Loading advisors...' : 'No advisors found'}
      searchable
      clearable
    />
  )
}

export default AdvisorSelect
