import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrophy } from '@fortawesome/free-solid-svg-icons'
import { useAppSelector } from '../../store/hooks'
import { selectMode } from '../../store/themeSlice'
import type { ThemeMode } from '../../store/themeSlice'
import { colors, spacing, typography, radii } from '../../theme'
import { fetchAchievements, type Achievement } from '../../api/engagement'
import { formatDate } from '../../format'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${spacing[0.5]};

  @media (min-width: 640px) {
    grid-template-columns: repeat(4, 1fr);
  }
`

const Tile = styled.div<{ $mode: ThemeMode; $unlocked: boolean }>`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
  padding: ${spacing[0.5]} ${spacing[0.75]};
  border-radius: ${radii.md};
  background: ${(p) => (p.$mode === 'dark' ? '#0f172a' : colors.gray[50])};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[100])};
  opacity: ${(p) => (p.$unlocked ? 1 : 0.55)};
  filter: ${(p) => (p.$unlocked ? 'none' : 'grayscale(0.7)')};
  min-width: 0;
`

const Trophy = styled.span<{ $unlocked: boolean }>`
  color: ${(p) => (p.$unlocked ? colors.warning[500] : colors.gray[300])};
  font-size: ${typography.sizes.base};
  flex-shrink: 0;
  display: flex;
`

const Text = styled.div`
  min-width: 0;
`

const Name = styled.div<{ $mode: ThemeMode }>`
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.semibold};
  color: ${(p) => (p.$mode === 'dark' ? '#e2e8f0' : colors.gray[700])};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Desc = styled.div<{ $mode: ThemeMode; $muted?: boolean }>`
  font-size: 0.6rem;
  color: ${(p) => (p.$muted ? (p.$mode === 'dark' ? '#475569' : colors.gray[300]) : p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Empty = styled.p<{ $mode: ThemeMode }>`
  margin: 0;
  font-size: ${typography.sizes.xs};
  color: ${(p) => (p.$mode === 'dark' ? '#64748b' : colors.gray[400])};
`

/** Restrained achievements — earned from deterministic events, no popups. */
export default function AchievementsSection() {
  const themeMode = useAppSelector(selectMode)
  const [achievements, setAchievements] = useState<Achievement[] | null>(null)

  useEffect(() => {
    let mounted = true
    fetchAchievements()
      .then((a) => mounted && setAchievements(a))
      .catch(() => mounted && setAchievements([]))
    return () => {
      mounted = false
    }
  }, [])

  if (achievements === null) return null

  if (achievements.length === 0) {
    return <Empty $mode={themeMode}>No achievements yet — keep tracking your goals.</Empty>
  }

  return (
    <Grid>
      {achievements.map((a) => (
        <Tile
          key={a.code}
          $mode={themeMode}
          $unlocked={a.unlocked}
          title={a.unlocked ? `${a.name} — ${a.description}` : `${a.name} — locked`}
        >
          <Trophy $unlocked={a.unlocked}>
            <FontAwesomeIcon icon={faTrophy} />
          </Trophy>
          <Text>
            <Name $mode={themeMode}>{a.name}</Name>
            <Desc $mode={themeMode} $muted={!a.unlocked}>
              {a.unlocked
                ? a.unlockedAt
                  ? `Unlocked ${formatDate(a.unlockedAt)}`
                  : a.description
                : a.description}
            </Desc>
          </Text>
        </Tile>
      ))}
    </Grid>
  )
}
