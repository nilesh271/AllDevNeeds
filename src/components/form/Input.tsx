import { ComponentType } from 'react'
import { Input as MaterialInput } from '@material-tailwind/react'

type MaterialInputProps = Record<string, any>

/** Adds the application's shared visual defaults to a Material Tailwind input. */
export function withInputStyles(BaseComponent: ComponentType<MaterialInputProps>) {
  return function StandardizedInput({ className = '', labelProps, containerProps, ...props }: MaterialInputProps) {
    return (
      <BaseComponent
        {...props}
        className={`text-gray-900 dark:text-white ${className}`}
        labelProps={{ className: 'dark:text-gray-400', ...labelProps }}
        containerProps={{ className: 'min-w-0', ...containerProps }}
      />
    )
  }
}

const Input = withInputStyles(MaterialInput)
export default Input
