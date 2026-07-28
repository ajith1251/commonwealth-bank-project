declare module 'emoji-mart' {
  import { ComponentType } from 'react'

  export interface BaseEmoji {
    id: string
    name: string
    colons: string
    emoticons: string[]
    unified: string
    skin: number
    native: string
  }

  interface PickerProps {
    theme?: 'light' | 'dark' | 'auto'
    showPreview?: boolean
    showSkinTones?: boolean
    onClick?: (emoji: BaseEmoji, event: React.MouseEvent) => void
    color?: string
    native?: boolean
    set?: string
    emojiSize?: number
    emoji?: string
    perLine?: number
    i18n?: Record<string, unknown>
  }

  export const Picker: ComponentType<PickerProps>
}

declare module 'emoji-mart/css/emoji-mart.css' {}
