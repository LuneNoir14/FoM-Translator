import type {
  ValidateEntryInput,
  ValidationIssue,
  ValidationResult,
} from '../../shared/contracts.js'
import { countLiteralLineBreaks, tokenizeText } from './tokenizeText.js'

const TRANSLATABLE_EQUALS_TOKEN = '=...='

function normalizeValidationToken(token: string) {
  if (token.startsWith('=') && token.endsWith('=')) {
    return TRANSLATABLE_EQUALS_TOKEN
  }

  return token
}

function buildLengthWarnings(
  sourceText: string,
  translatedText: string,
): ValidationIssue[] {
  if (!sourceText.trim() || !translatedText.trim()) {
    return []
  }

  if (translatedText.length > sourceText.length * 3) {
    return [
      {
        code: 'length-drift',
        message: 'Translated text is much longer than the source text.',
      },
    ]
  }

  return []
}

export function validateEntry(
  input: ValidateEntryInput,
): ValidationResult {
  const sourceTokens = tokenizeText(input.sourceText)
  const translatedTokens = tokenizeText(input.translatedText)
  const errors: ValidationIssue[] = []
  const translatedTokenCounts = new Map<string, number>()

  for (const token of translatedTokens) {
    if (token === '\\n') {
      continue
    }

    const normalizedToken = normalizeValidationToken(token)
    translatedTokenCounts.set(
      normalizedToken,
      (translatedTokenCounts.get(normalizedToken) ?? 0) + 1,
    )
  }

  for (const token of sourceTokens) {
    if (token === '\\n') {
      continue
    }

    const normalizedToken = normalizeValidationToken(token)
    const availableCount = translatedTokenCounts.get(normalizedToken) ?? 0

    if (availableCount === 0) {
      errors.push({
        code: 'missing-placeholder',
        message: `Missing required token: ${token}`,
        token,
      })
      continue
    }

    translatedTokenCounts.set(normalizedToken, availableCount - 1)
  }

  if (
    countLiteralLineBreaks(input.sourceText) !==
    countLiteralLineBreaks(input.translatedText)
  ) {
    errors.push({
      code: 'line-break-mismatch',
      message: 'Translated text must preserve literal line break tokens.',
      token: '\\n',
    })
  }

  return {
    errors,
    warnings: buildLengthWarnings(input.sourceText, input.translatedText),
  }
}
