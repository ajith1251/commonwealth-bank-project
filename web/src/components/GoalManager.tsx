import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react'
import styled, { keyframes } from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSmile,
  faTriangleExclamation,
  faSpinner,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons'
import type { BaseEmoji } from 'emoji-mart'
import { useAppSelector, useAppDispatch } from '../store/hooks'
import {
  selectGoalsMap,
  updateGoalRedux,
  createGoal as createGoalThunk,
  removeGoal as removeGoalThunk,
} from '../store/goalSlice'
import { updateGoal as updateGoalApi } from '../api/lib'
import { config } from '../config'
import { Goal } from '../types'
import { colors, spacing, typography, shadows, radii, transitions, zIndex } from '../theme'
import GoalIcon from './GoalIcon'

// Lazy-load emoji-mart (~500KB) only when the user opens the emoji picker
const EmojiPicker = lazy(() => import('./EmojiPicker'))

const EmojiPickerFallback = styled.div`
  width: 340px;
  height: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.gray[400]};
`

type Props = {
  goalId: string | null  // null = create mode, non-null = edit mode
  onClose: () => void
  onToast: (message: string, type: 'success' | 'error') => void
}

// ── Validation ────────────────────────────────────────────────────────

interface FieldErrors {
  name?: string
  targetAmount?: string
  targetDate?: string
}

function validateName(value: string): string | undefined {
  if (!value.trim()) return 'Goal name is required'
  if (value.length > 100) return 'Name is too long (max 100 characters)'
  return undefined
}

function validateAmount(value: number): string | undefined {
  if (isNaN(value) || value <= 0) return 'Amount must be greater than 0'
  if (value > 100_000_000) return 'Amount seems unreasonably large'
  return undefined
}

function validateDate(value: string): string | undefined {
  if (!value) return 'Target date is required'
  return undefined
}

// ── Animations ────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const slideUp = keyframes`
  from { transform: translateY(24px) scale(0.97); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
`

// ── Styled Components ─────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${zIndex.modal};
  padding: ${spacing[1]};
  backdrop-filter: blur(2px);
  animation: ${fadeIn} 0.15s ease;
`

const Modal = styled.div`
  background: ${colors.white};
  border-radius: ${radii.xl};
  padding: ${spacing[2]};
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${shadows.xl};
  position: relative;
  animation: ${slideUp} 0.2s ease;
`

const CloseButton = styled.button`
  position: absolute;
  top: ${spacing[0.75]};
  right: ${spacing[0.75]};
  background: none;
  border: none;
  font-size: ${typography.sizes.xl};
  cursor: pointer;
  color: ${colors.gray[400]};
  width: 36px;
  height: 36px;
  border-radius: ${radii.md};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background ${transitions.fast}, color ${transitions.fast};

  &:hover {
    background: ${colors.gray[50]};
    color: ${colors.gray[600]};
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary[500]};
    outline-offset: 2px;
  }
`

const Header = styled.h2`
  margin: 0 0 ${spacing[1.5]};
  font-size: ${typography.sizes.xl};
  font-weight: ${typography.weights.bold};
  color: ${colors.gray[800]};
  padding-right: ${spacing[2]};
`

// ── Icon Section ──────────────────────────────────────────────────────

const IconSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: ${spacing[1.5]};
  position: relative;
  min-height: 100px;
`

const EmojiPickerWrapper = styled.div<{ $isOpen: boolean; $hasIcon: boolean }>`
  display: ${(p) => (p.$isOpen ? 'flex' : 'none')};
  position: absolute;
  top: ${(p) => (p.$hasIcon ? '6rem' : '4rem')};
  left: 50%;
  transform: translateX(-50%);
  z-index: ${zIndex.dropdown};
  box-shadow: ${shadows.lg};
  border-radius: ${radii.md};
`

const TransparentButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  gap: ${spacing[0.5]};
  color: ${colors.gray[600]};
  transition: color ${transitions.fast};

  &:hover {
    color: ${colors.primary[600]};
  }
`

const AddIconButtonContainer = styled.div<{ $hasIcon: boolean }>`
  display: ${(p) => (p.$hasIcon ? 'none' : 'flex')};
  flex-direction: column;
  align-items: center;
  gap: ${spacing[0.5]};
  padding: ${spacing[1.25]};
  border: 2px dashed ${colors.gray[200]};
  border-radius: ${radii.lg};
  width: 100%;
  cursor: pointer;
  transition: border-color ${transitions.fast}, background ${transitions.fast};

  &:hover {
    border-color: ${colors.primary[300]};
    background: ${colors.primary[50]};
  }
`

const GoalIconContainer = styled.div<{ $shouldShow: boolean }>`
  display: ${(p) => (p.$shouldShow ? 'flex' : 'none')};
  flex-direction: column;
  align-items: center;
`

// ── Form ──────────────────────────────────────────────────────────────

const Form = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[0.25]};
`

const Label = styled.label`
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.semibold};
  color: ${colors.gray[600]};
`

const Input = styled.input<{ $hasError?: boolean }>`
  padding: ${spacing[0.5]} ${spacing[0.75]};
  border: 1px solid ${(p) => (p.$hasError ? colors.error[400] : colors.gray[200])};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.base};
  color: ${colors.gray[800]};
  background: ${(p) => (p.$hasError ? colors.error[50] : colors.gray[50])};
  transition: border-color ${transitions.fast}, box-shadow ${transitions.fast}, background ${transitions.fast};

  &:focus {
    outline: none;
    border-color: ${(p) => (p.$hasError ? colors.error[500] : colors.primary[500])};
    box-shadow: 0 0 0 3px ${(p) => (p.$hasError ? colors.error[100] : colors.primary[100])};
    background: ${colors.white};
  }

  &::placeholder {
    color: ${colors.gray[400]};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const FieldError = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: ${typography.sizes.xs};
  color: ${colors.error[500]};
  font-weight: ${typography.weights.medium};
  margin-top: 2px;
`

const ButtonRow = styled.div`
  display: flex;
  gap: ${spacing[0.75]};
  margin-top: ${spacing[0.75]};
`

const CancelButton = styled.button`
  flex: 1;
  padding: ${spacing[0.75]} ${spacing[1]};
  background: ${colors.white};
  color: ${colors.gray[600]};
  border: 1px solid ${colors.gray[200]};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.medium};
  cursor: pointer;
  transition: background ${transitions.fast}, border-color ${transitions.fast};

  &:hover {
    background: ${colors.gray[50]};
    border-color: ${colors.gray[300]};
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary[500]};
    outline-offset: 2px;
  }
`

const SaveButton = styled.button`
  flex: 2;
  padding: ${spacing[0.75]} ${spacing[1.5]};
  background: linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[700]});
  color: ${colors.white};
  border: none;
  border-radius: ${radii.md};
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  cursor: pointer;
  transition: opacity ${transitions.fast}, transform ${transitions.fast};

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${colors.primary[500]};
    outline-offset: 2px;
  }
`

// ── Confirm Dialog ────────────────────────────────────────────────────

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${zIndex.modal + 1};
  padding: ${spacing[1]};
  animation: ${fadeIn} 0.1s ease;
`

const ConfirmDialog = styled.div`
  background: ${colors.white};
  border-radius: ${radii.lg};
  padding: ${spacing[1.5]};
  max-width: 360px;
  width: 100%;
  box-shadow: ${shadows.xl};
  text-align: center;
  animation: ${slideUp} 0.15s ease;
`

const ConfirmTitle = styled.p`
  font-size: ${typography.sizes.base};
  font-weight: ${typography.weights.semibold};
  color: ${colors.gray[800]};
  margin: 0 0 ${spacing[0.5]};
`

const ConfirmText = styled.p`
  font-size: ${typography.sizes.sm};
  color: ${colors.gray[500]};
  margin: 0 0 ${spacing[1]};
`

const ConfirmButtons = styled.div`
  display: flex;
  gap: ${spacing[0.75]};
  justify-content: center;
`

const ConfirmCancelBtn = styled.button`
  padding: ${spacing[0.5]} ${spacing[1]};
  background: ${colors.white};
  color: ${colors.gray[600]};
  border: 1px solid ${colors.gray[200]};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.medium};
  cursor: pointer;
`

const DeleteButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${spacing[0.5]};
  width: 100%;
  margin-top: ${spacing[0.75]};
  padding: ${spacing[0.5]};
  background: none;
  color: ${colors.error[400]};
  border: 1px solid ${colors.error[100]};
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.medium};
  cursor: pointer;
  transition: background ${transitions.fast}, color ${transitions.fast}, border-color ${transitions.fast};

  &:hover {
    background: ${colors.error[50]};
    color: ${colors.error[600]};
    border-color: ${colors.error[400]};
  }

  &:focus-visible {
    outline: 2px solid ${colors.error[500]};
    outline-offset: 2px;
  }
`

const ConfirmLeaveBtn = styled.button`
  padding: ${spacing[0.5]} ${spacing[1]};
  background: ${colors.error[500]};
  color: ${colors.white};
  border: none;
  border-radius: ${radii.md};
  font-size: ${typography.sizes.sm};
  font-weight: ${typography.weights.medium};
  cursor: pointer;
`

// ── Component ─────────────────────────────────────────────────────────

export default function GoalManager(props: Props) {
  const dispatch = useAppDispatch()
  const goal = props.goalId ? useAppSelector(selectGoalsMap)[props.goalId] : null
  const isCreateMode = props.goalId === null

  const [icon, setIcon] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState(0)
  const [targetDate, setTargetDate] = useState('')
  const [emojiPickerIsOpen, setEmojiPickerIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const [pendingClose, setPendingClose] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Track initial values to detect dirty state
  const initialValues = useRef<{ name: string; targetAmount: number; targetDate: string; icon: string | null } | null>(null)

  useEffect(() => {
    if (!isCreateMode && goal && !initialValues.current) {
      initialValues.current = {
        icon: goal.icon,
        name: goal.name,
        targetAmount: goal.targetAmount,
        targetDate: goal.targetDate ? goal.targetDate.split('T')[0] : '',
      }
      setIcon(goal.icon)
      setName(goal.name)
      setTargetAmount(goal.targetAmount)
      setTargetDate(goal.targetDate ? goal.targetDate.split('T')[0] : '')
    } else if (isCreateMode && !initialValues.current) {
      // Create mode: initialize empty
      initialValues.current = { icon: null, name: '', targetAmount: 0, targetDate: '' }
    }
  }, [goal, isCreateMode])

  // ── Dirty state ───────────────────────────────────────────────────
  const isDirty = useMemo(() => {
    if (!initialValues.current) return false
    const init = initialValues.current
    return (
      name !== init.name ||
      targetAmount !== init.targetAmount ||
      targetDate !== init.targetDate ||
      icon !== init.icon
    )
  }, [name, targetAmount, targetDate, icon])

  // ── Validation ────────────────────────────────────────────────────
  const validate = useCallback((): FieldErrors => {
    const e: FieldErrors = {}
    const nameErr = validateName(name)
    if (nameErr) e.name = nameErr
    const amountErr = validateAmount(targetAmount)
    if (amountErr) e.targetAmount = amountErr
    const dateErr = validateDate(targetDate)
    if (dateErr) e.targetDate = dateErr
    return e
  }, [name, targetAmount, targetDate])

  const validateOnBlur = useCallback(
    (field: keyof FieldErrors, value: string | number) => {
      setTouched((prev) => new Set(prev).add(field))
      setErrors((prev) => {
        const next = { ...prev }
        if (field === 'name') next.name = validateName(value as string)
        if (field === 'targetAmount') next.targetAmount = validateAmount(value as number)
        if (field === 'targetDate') next.targetDate = validateDate(value as string)
        return next
      })
    },
    [],
  )

  // ── Handlers ──────────────────────────────────────────────────────
  const hasIcon = icon != null

  const addIconOnClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    setEmojiPickerIsOpen(true)
  }, [])

  const pickEmojiOnClick = useCallback(
    (emoji: BaseEmoji, event: React.MouseEvent) => {
      event.stopPropagation()
      setIcon(emoji.native)
      setEmojiPickerIsOpen(false)

      // In edit mode, auto-save the icon immediately
      if (!isCreateMode && goal) {
        const updatedGoal: Goal = {
          ...goal,
          icon: emoji.native ?? goal.icon,
          name: name || goal.name,
          targetDate: targetDate ? new Date(targetDate).toISOString() : goal.targetDate,
          targetAmount: targetAmount || goal.targetAmount,
        }

        dispatch(updateGoalRedux(updatedGoal))
        updateGoalApi(goal.id, updatedGoal).then((result) => {
          if (result.error) {
            props.onToast(result.error.message || 'Failed to save icon', 'error')
          } else {
            props.onToast('Icon updated', 'success')
          }
        })
      }
    },
    [goal, isCreateMode, name, targetAmount, targetDate, dispatch, props.onToast],
  )

  const handleSave = useCallback(async () => {
    // Validate all fields
    const allErrors = validate()
    setErrors(allErrors)
    setTouched(new Set(['name', 'targetAmount', 'targetDate']))

    if (Object.keys(allErrors).length > 0) return

    setSaving(true)

    if (isCreateMode) {
      // Create new goal
      const result = await dispatch(createGoalThunk({
        name,
        targetAmount,
        targetDate: targetDate ? new Date(targetDate).toISOString() : new Date().toISOString(),
        balance: 0,
        icon,
        accountId: null,
        transactionIds: null,
        tagIds: null,
        userId: config.userId,
      }))

      setSaving(false)

      if (createGoalThunk.fulfilled.match(result)) {
        props.onToast('Goal created', 'success')
        props.onClose()
      } else {
        const msg = (result.payload as string) ?? 'Failed to create goal'
        props.onToast(msg, 'error')
      }
    } else if (goal) {
      // Update existing goal
      const updatedGoal: Goal = {
        ...goal,
        icon,
        name,
        targetAmount,
        targetDate: targetDate ? new Date(targetDate).toISOString() : goal.targetDate,
      }

      dispatch(updateGoalRedux(updatedGoal))
      const result = await updateGoalApi(goal.id, updatedGoal)
      setSaving(false)

      if (result.error) {
        props.onToast(result.error.message || 'Failed to save goal', 'error')
      } else {
        props.onToast('Goal saved', 'success')
        props.onClose()
      }
    }
  }, [goal, isCreateMode, icon, name, targetAmount, targetDate, dispatch, props.onClose, props.onToast, validate])

  const handleDelete = useCallback(async () => {
    if (!goal) return
    setDeleting(true)
    const result = await dispatch(removeGoalThunk(goal.id))
    setDeleting(false)
    setShowDeleteConfirm(false)

    if (removeGoalThunk.fulfilled.match(result)) {
      props.onToast('Goal deleted', 'success')
      props.onClose()
    } else {
      const msg = (result.payload as string) ?? 'Failed to delete goal'
      props.onToast(msg, 'error')
    }
  }, [goal, dispatch, props.onClose, props.onToast])

  const handleClose = useCallback(() => {
    if (isDirty && !pendingClose) {
      setShowConfirmClose(true)
    } else {
      props.onClose()
    }
  }, [isDirty, pendingClose, props.onClose])

  const confirmClose = useCallback(() => {
    setShowConfirmClose(false)
    setPendingClose(true)
    requestAnimationFrame(() => props.onClose())
  }, [props.onClose])

  const cancelClose = useCallback(() => {
    setShowConfirmClose(false)
  }, [])

  return (
    <Overlay onClick={handleClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={handleClose} aria-label="Close">
          &times;
        </CloseButton>

        <Header>{isCreateMode ? 'Create Goal' : 'Edit Goal'}</Header>

        <IconSection>
          <GoalIconContainer $shouldShow={hasIcon}>
            <GoalIcon icon={icon!} onClick={addIconOnClick} />
          </GoalIconContainer>

          <AddIconButtonContainer $hasIcon={hasIcon} onClick={addIconOnClick}>
            <TransparentButton onClick={addIconOnClick}>
              <FontAwesomeIcon icon={faSmile} size="2x" />
              <span>Add icon</span>
            </TransparentButton>
          </AddIconButtonContainer>

          <EmojiPickerWrapper
            $isOpen={emojiPickerIsOpen}
            $hasIcon={hasIcon}
            onClick={(event) => event.stopPropagation()}
          >
            <Suspense fallback={<EmojiPickerFallback><FontAwesomeIcon icon={faSpinner} spin size="2x" /></EmojiPickerFallback>}>
              <EmojiPicker onClick={pickEmojiOnClick} />
            </Suspense>
          </EmojiPickerWrapper>
        </IconSection>

        <Form>
          <Field>
            <Label htmlFor="goal-name">Name</Label>
            <Input
              id="goal-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => validateOnBlur('name', name)}
              $hasError={touched.has('name') && !!errors.name}
              placeholder="e.g. Vacation Fund"
              aria-invalid={touched.has('name') && !!errors.name}
              aria-describedby={errors.name ? 'goal-name-error' : undefined}
            />
            {touched.has('name') && errors.name && (
              <FieldError id="goal-name-error" role="alert">
                <FontAwesomeIcon icon={faTriangleExclamation} size="xs" /> {errors.name}
              </FieldError>
            )}
          </Field>

          <Field>
            <Label htmlFor="goal-amount">Target Amount ($)</Label>
            <Input
              id="goal-amount"
              type="number"
              min={0}
              value={targetAmount || ''}
              onChange={(e) => setTargetAmount(Number(e.target.value))}
              onBlur={() => validateOnBlur('targetAmount', targetAmount)}
              $hasError={touched.has('targetAmount') && !!errors.targetAmount}
              placeholder="0"
              aria-invalid={touched.has('targetAmount') && !!errors.targetAmount}
              aria-describedby={errors.targetAmount ? 'goal-amount-error' : undefined}
            />
            {touched.has('targetAmount') && errors.targetAmount && (
              <FieldError id="goal-amount-error" role="alert">
                <FontAwesomeIcon icon={faTriangleExclamation} size="xs" /> {errors.targetAmount}
              </FieldError>
            )}
          </Field>

          <Field>
            <Label htmlFor="goal-date">Target Date</Label>
            <Input
              id="goal-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              onBlur={() => validateOnBlur('targetDate', targetDate)}
              $hasError={touched.has('targetDate') && !!errors.targetDate}
              aria-invalid={touched.has('targetDate') && !!errors.targetDate}
              aria-describedby={errors.targetDate ? 'goal-date-error' : undefined}
            />
            {touched.has('targetDate') && errors.targetDate && (
              <FieldError id="goal-date-error" role="alert">
                <FontAwesomeIcon icon={faTriangleExclamation} size="xs" /> {errors.targetDate}
              </FieldError>
            )}
          </Field>

          <ButtonRow>
            <CancelButton onClick={handleClose} type="button">
              Cancel
            </CancelButton>
            <SaveButton onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : (isCreateMode ? 'Create Goal' : 'Save Changes')}
            </SaveButton>
          </ButtonRow>
        </Form>

        {/* ── Delete button (edit mode only) ────────── */}
        {!isCreateMode && (
          <DeleteButton onClick={() => setShowDeleteConfirm(true)} disabled={deleting}>
            <FontAwesomeIcon icon={faTrashCan} />
            {deleting ? 'Deleting…' : 'Delete Goal'}
          </DeleteButton>
        )}
      </Modal>

      {/* ── Confirm close dialog ───────────────────── */}
      {showConfirmClose && (
        <ConfirmOverlay onClick={cancelClose}>
          <ConfirmDialog onClick={(e) => e.stopPropagation()}>
            <ConfirmTitle>Unsaved changes</ConfirmTitle>
            <ConfirmText>
              You have unsaved changes. Are you sure you want to close?
            </ConfirmText>
            <ConfirmButtons>
              <ConfirmCancelBtn onClick={cancelClose}>Keep editing</ConfirmCancelBtn>
              <ConfirmLeaveBtn onClick={confirmClose}>Discard changes</ConfirmLeaveBtn>
            </ConfirmButtons>
          </ConfirmDialog>
        </ConfirmOverlay>
      )}

      {/* ── Confirm delete dialog ──────────────────── */}
      {showDeleteConfirm && (
        <ConfirmOverlay onClick={() => setShowDeleteConfirm(false)}>
          <ConfirmDialog onClick={(e) => e.stopPropagation()}>
            <ConfirmTitle>Delete Goal?</ConfirmTitle>
            <ConfirmText>
              This action cannot be undone. Are you sure you want to delete &ldquo;{goal?.name}&rdquo;?
            </ConfirmText>
            <ConfirmButtons>
              <ConfirmCancelBtn onClick={() => setShowDeleteConfirm(false)}>Cancel</ConfirmCancelBtn>
              <ConfirmLeaveBtn onClick={handleDelete}>Delete</ConfirmLeaveBtn>
            </ConfirmButtons>
          </ConfirmDialog>
        </ConfirmOverlay>
      )}
    </Overlay>
  )
}
