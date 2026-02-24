import {
  Badge,
  Box,
  Burger,
  Button,
  Divider,
  Flex,
  Group,
  Menu,
  Skeleton,
  Text,
  UnstyledButton,
} from '@mantine/core'
import Logo from '../Logo/Logo'
import { Link, useNavigate } from 'react-router'
import ColorSchemeToggleButton from '../ColorSchemeToggleButton/ColorSchemeToggleButton'
import { useAuthenticationContext, useUser } from '../../hooks/authentication'
import CustomAvatar from '../CustomAvatar/CustomAvatar'
import { GearSix, NewspaperClipping, SignOut } from 'phosphor-react'

interface HeaderProps {
  authenticatedArea: boolean
  opened?: boolean | undefined
  toggle?: () => void
}

const Header = ({ opened, toggle, authenticatedArea }: HeaderProps) => {
  const user = useUser()
  const context = useAuthenticationContext()

  const navigate = useNavigate()

  return (
    <Flex justify='space-between' align='center' h='100%' w='100%'>
      <Flex
        gap={'xs'}
        justify='flex-start'
        align='center'
        h='100%'
        style={{ cursor: 'pointer' }}
        onClick={() => (authenticatedArea ? navigate('/dashboard') : navigate('/'))}
      >
        <Logo size={40} />
        <Text fw='bold' visibleFrom='sm' pt='2px'>
          CILE Management
        </Text>
      </Flex>

      <Flex
        justify='space-between'
        align='center'
        h='100%'
        gap='md'
        visibleFrom={authenticatedArea ? 'md' : undefined}
      >
        <ColorSchemeToggleButton iconSize={'70%'} size={'lg'} />
        {context.isAuthenticated ? (
          <Group gap='xs' align='center'>
            {user ? (
              <Box ta='right'>
                <Text size='sm' fw={500} lh={1.2}>
                  {user.email}
                </Text>
                {user.groups.length > 0 && (
                  <Group gap={4} mt={4} justify='flex-end'>
                    {user.groups.map((group) => (
                      <Badge key={group} size='xs' variant='light'>
                        {group}
                      </Badge>
                    ))}
                  </Group>
                )}
              </Box>
            ) : (
              <Skeleton height={32} width={120} />
            )}
          <Menu
            shadow='md'
            width={200}
            position='bottom-end'
            withArrow
            transitionProps={{ transition: 'scale-y', duration: 200 }}
          >
            <Menu.Target>
              <UnstyledButton>
                <Group gap='xs' align='center'>
                  {user ? <CustomAvatar user={user} size={35} /> : <Skeleton height={35} circle />}
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
              {!authenticatedArea && (
                <Menu.Item
                  component={Link}
                  to='/dashboard'
                  leftSection={<NewspaperClipping size={16} />}
                >
                  Go to Dashboard
                </Menu.Item>
              )}
              <Menu.Item component={Link} to='/settings' leftSection={<GearSix size={16} />}>
                Settings
              </Menu.Item>
              <Divider />
              <Menu.Item component={Link} to='/logout' leftSection={<SignOut size={16} />}>
                Logout
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          </Group>
        ) : (
          <Button component={Link} to='/dashboard'>
            Login
          </Button>
        )}
      </Flex>
      {authenticatedArea && opened !== undefined && (
        <Group h='100%' hiddenFrom='md'>
          <Burger opened={opened} onClick={toggle} size='md' />
        </Group>
      )}
    </Flex>
  )
}

export default Header
