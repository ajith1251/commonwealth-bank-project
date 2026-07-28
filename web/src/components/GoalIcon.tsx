import styled from 'styled-components'
import { colors, transitions } from '../theme'

type Props = {
  icon: string
  onClick?: (event: React.MouseEvent) => void
}

const Icon = styled.h1`
  font-size: 6rem;
  cursor: pointer;
  margin: 0;
  line-height: 1;
  user-select: none;
  transition: transform ${transitions.normal};
  border-radius: 12px;
  padding: 0.25rem;

  &:hover {
    transform: scale(1.12);
  }

  &:active {
    transform: scale(0.95);
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary[500]};
    outline-offset: 4px;
  }
`

export default function GoalIcon(props: Props) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      props.onClick?.(event as unknown as React.MouseEvent)
    }
  }

  return (
    <Icon
      onClick={props.onClick}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label="Change goal icon"
      tabIndex={0}
    >
      {props.icon}
    </Icon>
  )
}
