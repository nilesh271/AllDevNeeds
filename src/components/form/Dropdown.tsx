import { Option, Select } from '@material-tailwind/react'

export interface DropdownOption {
  label: string
  value: string
}

interface DropdownProps {
  label: string
  value?: string
  onChange: (value: string | undefined) => void
  options: DropdownOption[]
  className?: string
}

export default function Dropdown({ label, value, onChange, options, className = '' }: DropdownProps) {
  return (
    <Select
      label={label}
      value={value}
      onChange={onChange}
      className={`dark:text-white ${className}`}
      labelProps={{ className: 'dark:text-gray-400' }}
      menuProps={{ className: 'dark:bg-gray-800 dark:border-gray-700 dark:text-white' }}
    >
      {options.map(option => (
        <Option 
          key={option.value} 
          value={option.value}
          className="dark:text-white dark:hover:bg-gray-700 dark:focus:bg-gray-700"
        >
          {option.label}
        </Option>
      ))}
    </Select>
  )
}
