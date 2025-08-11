import React, { useEffect, useState } from 'react'
import { Grid, MultiSelect, Select, TextInput } from '@mantine/core'
import { useThesesContext } from '../../providers/ThesesProvider/hooks'
import { ThesisState } from '../../requests/responses/thesis'
import { MagnifyingGlass } from 'phosphor-react'
import { formatThesisState, formatThesisType } from '../../utils/format'
import { GLOBAL_CONFIG } from '../../config/global'
import { doRequest } from '../../requests/request'
import { showSimpleError } from '../../utils/notification'
import { getApiResponseErrorMessage } from '../../requests/handler'
import { PaginationResponse } from '../../requests/responses/pagination'
import { ILightUser } from '../../requests/responses/user'
import { useLoggedInUser } from '../../hooks/authentication'

const ThesesFilters = () => {
  const { filters, setFilters, sort, setSort } = useThesesContext()
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
          // Default to current user if they are an advisor/supervisor and no advisor filter is set
          if (!filters.advisorIds || filters.advisorIds.length === 0) {
            const currentUserInAdvisors = res.data.content.find(
              (advisor) => advisor.userId === user.userId
            )
            if (currentUserInAdvisors) {
              setFilters((prev) => ({
                ...prev,
                advisorIds: [currentUserInAdvisors.userId],
              }))
            }
          }
        } else {
          showSimpleError(getApiResponseErrorMessage(res))
          setAdvisors([])
        }
      },
    )
  }, [user.userId, filters.advisorIds, setFilters])

  return (
    <Grid gutter='xs'>
      <Grid.Col span={6}>
        <TextInput
          label='Search'
          placeholder='Search theses...'
          leftSection={<MagnifyingGlass size={16} />}
          value={filters.search || ''}
          onChange={(x) => setFilters((prev) => ({ ...prev, search: x.target.value || undefined }))}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <Select
          label='Sort By'
          data={[
            { label: 'Start Date Ascending', value: 'startDate:asc' },
            { label: 'Start Date Descending', value: 'startDate:desc' },
            { label: 'Created Ascending', value: 'createdAt:asc' },
            { label: 'Created Descending', value: 'createdAt:desc' },
          ]}
          value={sort.column + ':' + sort.direction}
          onChange={(x) =>
            setSort({
              column: (x?.split(':')[0] || 'startDate') as any,
              direction: (x?.split(':')[1] || 'asc') as any,
            })
          }
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <MultiSelect
          hidePickedOptions
          label='Type'
          placeholder='CILE Formats'
          data={Object.keys(GLOBAL_CONFIG.thesis_types).map((key) => ({
            value: key,
            label: formatThesisType(key),
          }))}
          value={filters.types || []}
          onChange={(x) =>
            setFilters((prev) => ({
              ...prev,
              types: x,
            }))
          }
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <MultiSelect
          hidePickedOptions
          label='State'
          placeholder='Thesis States'
          data={Object.values(ThesisState).map((value) => ({
            value: value,
            label: formatThesisState(value),
          }))}
          value={filters.states || []}
          onChange={(x) =>
            setFilters((prev) => ({
              ...prev,
              states: x as ThesisState[],
            }))
          }
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <MultiSelect
          hidePickedOptions
          label='Faculty Advisor'
          placeholder='Select Advisors'
          data={advisors.map((advisor) => ({
            value: advisor.userId,
            label: `${advisor.firstName || ''} ${advisor.lastName || ''}`.trim() || advisor.universityId || 'Unknown',
          }))}
          value={filters.advisorIds || []}
          onChange={(value) => {
            setFilters((prev) => ({
              ...prev,
              advisorIds: value,
            }))
          }}
          searchable
        />
      </Grid.Col>
    </Grid>
  )
}

export default ThesesFilters
