import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Alert } from './Alert.vue'

export const alertVariants = cva(
  'relative flex gap-3 border p-4 text-sm [&>svg]:shrink-0 [&>svg]:mt-0.5',
  {
    variants: {
      variant: {
        info: 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400',
        warning:
          'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400',
        error:
          'bg-destructive/8 border-destructive/30 text-destructive dark:bg-destructive/15 [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
)

export type AlertVariants = VariantProps<typeof alertVariants>
