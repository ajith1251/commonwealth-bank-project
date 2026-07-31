import { useState, useMemo } from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileLines, faEye, faFloppyDisk } from '@fortawesome/free-solid-svg-icons'
import { colors, spacing, typography, radii, transitions } from '../../theme'
import { ALL_SECTIONS, REPORT_SECTION_LABELS, type ReportConfig, type ReportPeriod, type ReportSectionKey } from '../../api/reports'
import type { Goal } from '../../types'

const Card = styled.section`
  background: ${colors.white};
  border: 1px solid ${colors.gray[200]};
  border-radius: ${radii.lg};
  padding: ${spacing[1.25]};
`

const CardTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: ${spacing[0.5]};
  margin: 0 0 ${spacing[1]};
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  color: ${colors.gray[800]};

  svg {
    color: ${colors.primary[600]};
  }
`

const Field = styled.div`
  margin-bottom: ${spacing[0.75]};
`

const Label = styled.label`
  display: block;
  font-size: ${typography.sizes.xs};
  font-weight: ${typography.weights.medium};
  color: ${colors.gray[500]};
  margin-bottom: 4px;
`

const Input = styled.input`
  width: 100%;
  padding: ${spacing[0.5]} ${spacing[0.75]};
  border: 1px solid ${colors.gray[200]};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  color: ${colors.gray[800]};
  background: ${colors.white};
  transition: border-color ${transitions.fast};

  &:focus {
    outline: none;
    border-color: ${colors.primary[500]};
    box-shadow: 0 0 0 3px ${colors.primary[50]};
  }
`

const Select = styled.select`
  width: 100%;
  padding: ${spacing[0.5]} ${spacing[0.75]};
  border: 1px solid ${colors.gray[200]};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  color: ${colors.gray[800]};
  background: ${colors.white};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${colors.primary[500]};
  }
`

const DateRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[0.5]};
`

const SectionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;

  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`

const CheckItem = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${typography.sizes.xs};
  color: ${colors.gray[600]};
  cursor: pointer;
  padding: 4px 6px;
  border: 1px solid ${colors.gray[100]};
  border-radius: ${radii.sm};
  transition: border-color ${transitions.fast}, background ${transitions.fast};

  &:hover {
    border-color: ${colors.primary[200]};
  }

  input {
    accent-color: ${colors.primary[600]};
  }
`

const GoalSelectWrap = styled.div`
  max-height: 140px;
  overflow-y: auto;
  border: 1px solid ${colors.gray[100]};
  border-radius: ${radii.md};
  padding: ${spacing[0.5]};
`

const GoalCheckItem = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${typography.sizes.xs};
  color: ${colors.gray[600]};
  cursor: pointer;
  padding: 3px 4px;
  border-radius: 4px;

  &:hover {
    background: ${colors.gray[50]};
  }

  input {
    accent-color: ${colors.primary[600]};
  }
`

const Buttons = styled.div`
  display: flex;
  gap: ${spacing[0.5]};
  margin-top: ${spacing[0.75]};
  flex-wrap: wrap;
`

const Button = styled.button<{ $primary?: boolean; $disabled?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: ${spacing[0.5]} ${spacing[1]};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.semibold};
  cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
  opacity: ${(p) => (p.$disabled ? 0.5 : 1)};
  transition: all ${transitions.fast};
  border: none;
  background: ${(p) => (p.$primary ? colors.primary[600] : colors.white)};
  color: ${(p) => (p.$primary ? colors.white : colors.gray[600])};
  border: ${(p) => (p.$primary ? 'none' : `1px solid ${colors.gray[200]}`)};

  &:hover:not(:disabled) {
    background: ${(p) => (p.$primary ? colors.primary[700] : colors.gray[50])};
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }
`

const PERIOD_OPTIONS: Array<{ value: ReportPeriod; label: string }> = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '6m', label: 'Last 6 months' },
  { value: '12m', label: 'Last 12 months' },
  { value: 'all', label: 'All available data' },
  { value: 'custom', label: 'Custom date range' },
]

export type BuilderMode = 'preview' | 'save'

type Props = {
  goals: Goal[]
  defaultTitle: string
  busy: boolean
  busyLabel: string
  onSubmit: (config: ReportConfig, mode: BuilderMode) => void
}

export default function ReportBuilder({ goals, defaultTitle, busy, busyLabel, onSubmit }: Props) {
  const [title, setTitle] = useState(defaultTitle)
  const [period, setPeriod] = useState<ReportPeriod>('90d')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [goalScope, setGoalScope] = useState<'all' | 'selected'>('all')
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])
  const [sections, setSections] = useState<ReportSectionKey[]>(ALL_SECTIONS)

  const goalCount = goals.length

  const customRangeValid = useMemo(() => {
    if (period !== 'custom') return true
    if (!startDate || !endDate) return false
    return new Date(startDate).getTime() <= new Date(endDate).getTime()
  }, [period, startDate, endDate])

  const toggleSection = (key: ReportSectionKey) => {
    setSections((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]))
  }

  const toggleGoal = (id: string) => {
    setSelectedGoalIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }

  const buildConfig = (): ReportConfig | null => {
    if (!customRangeValid) return null
    return {
      ...(title.trim() ? { title: title.trim() } : {}),
      period,
      ...(period === 'custom'
        ? { startDate: new Date(startDate).toISOString(), endDate: new Date(endDate).toISOString() }
        : {}),
      goalIds: goalScope === 'all' ? 'all' : selectedGoalIds,
      sections,
    }
  }

  const handleSubmit = (mode: BuilderMode) => {
    const config = buildConfig()
    if (config) onSubmit(config, mode)
  }

  const canSubmit = goalCount > 0 && (goalScope === 'all' || selectedGoalIds.length > 0) && customRangeValid

  return (
    <Card>
      <CardTitle>
        <FontAwesomeIcon icon={faFileLines} /> Report Builder
      </CardTitle>

      <Field>
        <Label htmlFor="report-title">Report title</Label>
        <Input
          id="report-title"
          type="text"
          value={title}
          maxLength={80}
          placeholder="Financial Goals Report — July 2026"
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>

      <Field>
        <Label htmlFor="report-period">Reporting period</Label>
        <Select
          id="report-period"
          value={period}
          onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>

      {period === 'custom' && (
        <Field>
          <DateRow>
            <div>
              <Label htmlFor="report-start">Start date</Label>
              <Input
                id="report-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="report-end">End date</Label>
              <Input
                id="report-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </DateRow>
          {!customRangeValid && (
            <span style={{ fontSize: typography.sizes.xs, color: colors.error[500] }}>
              Start date must be on or before the end date.
            </span>
          )}
        </Field>
      )}

      <Field>
        <Label>Goals</Label>
        <Select
          aria-label="Goal scope"
          value={goalScope}
          onChange={(e) => setGoalScope(e.target.value as 'all' | 'selected')}
        >
          <option value="all">All goals ({goalCount})</option>
          <option value="selected">Selected goals</option>
        </Select>
      </Field>

      {goalScope === 'selected' && (
        <GoalSelectWrap role="group" aria-label="Select goals">
          {goals.map((g) => (
            <GoalCheckItem key={g.id}>
              <input
                type="checkbox"
                checked={selectedGoalIds.includes(g.id)}
                onChange={() => toggleGoal(g.id)}
              />
              <span>
                {g.icon} {g.name}
              </span>
            </GoalCheckItem>
          ))}
        </GoalSelectWrap>
      )}

      <Field>
        <Label>Report sections</Label>
        <SectionsGrid>
          {ALL_SECTIONS.map((key) => (
            <CheckItem key={key}>
              <input
                type="checkbox"
                checked={sections.includes(key)}
                onChange={() => toggleSection(key)}
              />
              {REPORT_SECTION_LABELS[key]}
            </CheckItem>
          ))}
        </SectionsGrid>
      </Field>

      <Buttons>
        <Button
          $primary
          $disabled={busy || !canSubmit}
          onClick={() => handleSubmit('preview')}
          aria-busy={busy}
        >
          {busy ? <>{busyLabel}…</> : (<><FontAwesomeIcon icon={faEye} /> Preview Report</>)}
        </Button>
        <Button
          $disabled={busy || !canSubmit}
          onClick={() => handleSubmit('save')}
          aria-busy={busy}
        >
          <FontAwesomeIcon icon={faFloppyDisk} /> Generate &amp; Save
        </Button>
      </Buttons>
    </Card>
  )
}
