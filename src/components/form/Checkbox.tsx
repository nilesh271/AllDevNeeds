import { Checkbox as MaterialCheckbox } from '@material-tailwind/react'

interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
}

export default function Checkbox({ label, checked, onChange, disabled }: CheckboxProps) {
  return <MaterialCheckbox label={label} checked={checked} onChange={onChange} disabled={disabled} className="border-sky-500" labelProps={{ className: 'text-gray-700 dark:text-gray-300' }} />
}
