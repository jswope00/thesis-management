import { ITopic } from '../../../../requests/responses/topic'
import { Accordion, Button, Center, Skeleton, Stack, Text } from '@mantine/core'
import { useTopicsContext } from '../../../../providers/TopicsProvider/hooks'
import React from 'react'
import TopicAccordionItem from '../../../../components/TopicAccordionItem/TopicAccordionItem'
import TopicsFilters from '../../../../components/TopicsFilters/TopicsFilters'
import { GLOBAL_CONFIG } from '../../../../config/global'

interface ISelectTopicStepProps {
  onComplete: (topic: ITopic | undefined) => unknown
}

const SelectTopicStep = (props: ISelectTopicStepProps) => {
  const { onComplete } = props

  const { topics } = useTopicsContext()

  if (
    !GLOBAL_CONFIG.allow_suggested_topics &&
    topics?.content.length === 0 &&
    topics?.pageNumber === 0
  ) {
    return (
      <Text ta='center' fw='bold' my='md'>
        The chair is currently not searching for theses.
      </Text>
    )
  }

  return (
    <Stack>
      
      {!topics && (
        <Stack>
          <Skeleton height={48} />
          <Skeleton height={48} />
          <Skeleton height={48} />
        </Stack>
      )}
      <Accordion variant='separated'>
        {topics?.content.map((topic) => (
          <TopicAccordionItem key={topic.topicId} topic={topic}>
            <Center mt='md'>
              <Button onClick={() => onComplete(topic)}>Apply for this Topic</Button>
            </Center>
          </TopicAccordionItem>
        ))}
        {GLOBAL_CONFIG.allow_suggested_topics && (
          <Center mt="md">
            <Button onClick={() => onComplete(undefined)}>Submit CILE Introduction</Button>
          </Center>
        )}
      </Accordion>
    </Stack>
  )
}

export default SelectTopicStep
