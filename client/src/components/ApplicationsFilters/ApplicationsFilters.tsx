import { Grid, MultiSelect, Select, TextInput } from '@mantine/core'
import { MagnifyingGlass } from 'phosphor-react'
import { ApplicationState } from '../../requests/responses/application'
import { useApplicationsContext } from '../../providers/ApplicationsProvider/hooks'
import React, { useEffect, useState } from 'react'
import { formatApplicationState, formatThesisType } from '../../utils/format'
import { GLOBAL_CONFIG } from '../../config/global'
import { doRequest } from '../../requests/request'
import { showSimpleError } from '../../utils/notification'
import { getApiResponseErrorMessage } from '../../requests/handler'
import { ILightUser } from '../../requests/responses/user'
import { PaginationResponse } from '../../requests/responses/pagination'
import { useLoggedInUser } from '../../hooks/authentication'

interface IApplicationsFiltersProps {
  size?: 'xl' | 'sm'
}

const ApplicationsFilters = (props: IApplicationsFiltersProps) => {
  const { size = 'xl' } = props

  const { topics, filters, setFilters, sort, setSort } = useApplicationsContext()
  const user = useLoggedInUser()
  
  const [advisors, setAdvisors] = useState<ILightUser[]>([])

  useEffect(() => {
    doRequest<PaginationResponse<ILightUser>>(
      '/v2/users',
      {
        method: 'GET',
        requiresAuth: true,
        params: {
          groups: 'advisor,supervisor',
          page: 0,
          limit: 1000,
          sortBy: 'firstName',
          sortOrder: 'asc',
        },
      },
      (res) => {
        if (res.ok) {
          setAdvisors(res.data.content)
          
          // Set default advisor filter to current user if they are an advisor/supervisor
          // and no advisor filter is currently set
          if (!filters.advisors || filters.advisors.length === 0) {
            const currentUserInAdvisors = res.data.content.find(
              (advisor) => advisor.userId === user.userId
            )
            
            if (currentUserInAdvisors) {
              setFilters((prev) => ({
                ...prev,
                advisors: [currentUserInAdvisors.userId],
              }))
            }
          }
        } else {
          showSimpleError(getApiResponseErrorMessage(res))
          setAdvisors([])
        }
      },
    )
  }, [user.userId, filters.advisors, setFilters])

  return (
    <Grid gutter='sm'>
      <Grid.Col span={12}>
        <TextInput
          placeholder='Search applications...'
          leftSection={<MagnifyingGlass size={16} />}
          value={filters.search || ''}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, search: e.currentTarget.value }))
          }}
        />
      </Grid.Col>
      <Grid.Col span={size === 'sm' ? 12 : 6}>
        <MultiSelect
          hidePickedOptions
          label='Topic'
          placeholder='Open Topics'
          data={[
            {
              value: 'NO_TOPIC',
              label: 'Suggested Topic',
            },
            ...(topics
              ? Object.values(topics).map((topic) => ({
                  value: topic.topicId,
                  label: topic.title,
                }))
              : []),
          ]}
          value={filters.topics || []}
          onChange={(value) => {
            setFilters((prev) => ({
              ...prev,
              topics: value,
            }))
          }}
          searchable
        />
      </Grid.Col>
      <Grid.Col span={size === 'sm' ? 12 : 6}>
        <MultiSelect
          hidePickedOptions
          label='Type'
          placeholder='CILE Formats'
          data={Object.keys(GLOBAL_CONFIG.thesis_types).map((key) => ({
            value: key,
            label: formatThesisType(key),
          }))}
          value={filters.types || []}
          onChange={(value) => {
            setFilters((prev) => ({
              ...prev,
              types: value,
            }))
          }}
          searchable
        />
      </Grid.Col>
      <Grid.Col span={size === 'sm' ? 12 : 6}>
        <MultiSelect
          hidePickedOptions
          label='States'
          placeholder='Application States'
          data={Object.values(ApplicationState).map((value) => ({
            value: value,
            label: formatApplicationState(value),
          }))}
          value={filters.states || []}
          onChange={(value) => {
            setFilters((prev) => ({
              ...prev,
              states: value as ApplicationState[],
            }))
          }}
          searchable
        />
      </Grid.Col>
      <Grid.Col span={size === 'sm' ? 12 : 6}>
        <MultiSelect
          hidePickedOptions
          label='Faculty Advisor'
          placeholder='Select Advisors'
          data={advisors.map((advisor) => ({
            value: advisor.userId,
            label: `${advisor.firstName || ''} ${advisor.lastName || ''}`.trim() || advisor.universityId || 'Unknown',
          }))}
          value={filters.advisors || []}
          onChange={(value) => {
            setFilters((prev) => ({
              ...prev,
              advisors: value,
            }))
          }}
          searchable
        />
      </Grid.Col>
      <Grid.Col span={size === 'sm' ? 12 : 6}>
        <Select
          label='Sort By'
          data={[
            { label: 'Created Ascending', value: 'createdAt:asc' },
            { label: 'Created Descending', value: 'createdAt:desc' },
          ]}
          value={sort.column + ':' + sort.direction}
          onChange={(x) =>
            setSort({
              column: (x?.split(':')[0] || 'createdAt') as any,
              direction: (x?.split(':')[1] || 'asc') as any,
            })
          }
        />
      </Grid.Col>
    </Grid>
  )
}

export default ApplicationsFilters
