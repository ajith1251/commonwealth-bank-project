import styled, { keyframes } from 'styled-components'
import { colors, radii } from '../../theme'

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

const shimmerGradient = (mode: 'light' | 'dark') =>
  mode === 'dark'
    ? `linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)`
    : `linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)`

const Wrapper = styled.div<{ $mode: 'light' | 'dark' }>`
  background: ${(p) => (p.$mode === 'dark' ? '#1e293b' : colors.white)};
  border: 1px solid ${(p) => (p.$mode === 'dark' ? '#334155' : colors.gray[200])};
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const ShimmerBlock = styled.div<{ $w?: string; $h?: string; $mode: 'light' | 'dark'; $radius?: string }>`
  width: ${(p) => p.$w ?? '100%'};
  height: ${(p) => p.$h ?? '16px'};
  border-radius: ${(p) => p.$radius ?? radii.md};
  background: ${(p) => shimmerGradient(p.$mode)};
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
`

type Props = {
  mode: 'light' | 'dark'
  height?: number
  chartType?: 'area' | 'bar' | 'pie' | 'grid'
}

export default function ChartSkeleton({ mode, chartType = 'area' }: Props) {
  return (
    <Wrapper $mode={mode}>
      <ShimmerBlock $w="40%" $h="16px" $mode={mode} />

      {chartType === 'area' && (
        <>
          <ShimmerBlock $w="100%" $h="200px" $radius="8px" $mode={mode} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
            <ShimmerBlock $w="15%" $h="12px" $mode={mode} />
            <ShimmerBlock $w="15%" $h="12px" $mode={mode} />
            <ShimmerBlock $w="15%" $h="12px" $mode={mode} />
            <ShimmerBlock $w="15%" $h="12px" $mode={mode} />
          </div>
        </>
      )}

      {chartType === 'bar' && (
        <>
          {[80, 65, 50, 35, 20].map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ShimmerBlock $w="100px" $h="12px" $mode={mode} />
              <ShimmerBlock $w={`${w}%`} $h="24px" $radius="4px" $mode={mode} />
            </div>
          ))}
        </>
      )}

      {chartType === 'pie' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <ShimmerBlock $w="140px" $h="140px" $radius="50%" $mode={mode} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShimmerBlock $w="12px" $h="12px" $radius="50%" $mode={mode} />
                <ShimmerBlock $w="60%" $h="12px" $mode={mode} />
                <ShimmerBlock $w="30px" $h="12px" $mode={mode} />
              </div>
            ))}
          </div>
        </div>
      )}

      {chartType === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12 }}>
              <ShimmerBlock $w="40%" $h="24px" $mode={mode} />
              <ShimmerBlock $w="60%" $h="12px" $mode={mode} />
            </div>
          ))}
        </div>
      )}
    </Wrapper>
  )
}
