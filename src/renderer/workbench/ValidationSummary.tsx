import type { ValidationResult } from '../../shared/contracts'

interface ValidationSummaryProps {
  validation: ValidationResult
  savedLabel: string
}

export function ValidationSummary({
  validation,
  savedLabel,
}: ValidationSummaryProps) {
  const hasErrors = validation.errors.length > 0

  return (
    <div className="validation-summary">
      <span>{savedLabel}</span>
      <span>{hasErrors ? `${validation.errors.length} errors` : 'Tokens OK'}</span>
      <span>
        {validation.warnings.length > 0
          ? `${validation.warnings.length} warnings`
          : 'No warnings'}
      </span>
    </div>
  )
}
