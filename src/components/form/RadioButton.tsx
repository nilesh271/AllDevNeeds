import { Radio } from '@material-tailwind/react'

interface RadioButtonProps {
  label: string
  name: string
  value: string
  checked: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export default function RadioButton({ label, name, value, checked, onChange }: RadioButtonProps) {
  return <Radio label={label} name={name} value={value} checked={checked} onChange={onChange} className="border-sky-500" labelProps={{ className: 'text-gray-700 dark:text-gray-300' }} />
}
