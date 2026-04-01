import { expect, test } from 'vitest'
import { validateEntry } from '../../src/main/project/validateEntry'

test('flags missing placeholders as errors', () => {
  const result = validateEntry({
    sourceText: "[Ari], meet me at Hayden's farm.",
    translatedText: "Benimle Hayden'in ciftliginde bulus.",
  })

  expect(result.errors).toContainEqual(
    expect.objectContaining({ code: 'missing-placeholder', token: '[Ari]' }),
  )
})

test('preserves line-break requirements', () => {
  const result = validateEntry({
    sourceText: 'Line 1\\n\\nLine 2',
    translatedText: 'Satir 1\\nSatir 2',
  })

  expect(result.errors).toContainEqual(
    expect.objectContaining({ code: 'line-break-mismatch' }),
  )
})

test('adds a warning when translated text grows unusually long', () => {
  const result = validateEntry({
    sourceText: 'Sleep',
    translatedText: 'Biraz uzunca ve supheli derecede genisletilmis bir ifade',
  })

  expect(result.warnings).toContainEqual(
    expect.objectContaining({ code: 'length-drift' }),
  )
})

test('allows translating text inside equals markers as long as the markers remain', () => {
  const result = validateEntry({
    sourceText: "Darcy's =Jasmine Tea= is to die for.",
    translatedText: "Darcy'nin =Yasemin Cayi= efsane.",
  })

  expect(result.errors).toEqual([])
})

test('still flags equals markers when the wrapped segment is removed entirely', () => {
  const result = validateEntry({
    sourceText: "Darcy's =Jasmine Tea= is to die for.",
    translatedText: "Darcy'nin Yasemin Cayi efsane.",
  })

  expect(result.errors).toContainEqual(
    expect.objectContaining({
      code: 'missing-placeholder',
      token: '=Jasmine Tea=',
    }),
  )
})
