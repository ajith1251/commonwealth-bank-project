import styled, { keyframes } from 'styled-components'
import { radii } from '../theme'

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

const shimmerGradient = (mode: 'light' | 'dark') =>
  mode === 'dark'
    ? `linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)`
    : `linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)`

const SkeletonBlock = styled.div<{ $w?: string; $h?: string; $radius?: string; $mode: 'light' | 'dark' }>`
  width: ${(p) => p.$w ?? '100%'};
  height: ${(p) => p.$h ?? '16px'};
  border-radius: ${(p) => p.$radius ?? radii.md};
  background: ${(p) => shimmerGradient(p.$mode)};
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
`

type SkeletonProps = {
  width?: string
  height?: string
  radius?: string
  mode: 'light' | 'dark'
}

export function Skeleton({ width, height, radius, mode }: SkeletonProps) {
  return <SkeletonBlock $w={width} $h={height} $radius={radius} $mode={mode} />
}

export function StatSkeleton({ mode }: { mode: 'light' | 'dark' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
      <Skeleton width="60%" height="12px" mode={mode} />
      <Skeleton width="80%" height="28px" mode={mode} />
    </div>
  )
}

export function GoalCardSkeleton({ mode }: { mode: 'light' | 'dark' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '20px',
        borderRadius: '12px',
        background: mode === 'dark' ? '#1e293b' : '#ffffff',
        border: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Skeleton width="40px" height="40px" radius="8px" mode={mode} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Skeleton width="60%" height="16px" mode={mode} />
          <Skeleton width="40%" height="12px" mode={mode} />
        </div>
      </div>
      <Skeleton width="100%" height="8px" radius="4px" mode={mode} />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton width="30%" height="12px" mode={mode} />
        <Skeleton width="20%" height="12px" mode={mode} />
      </div>
    </div>
  )
}
