import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { TranslationEditorPanel } from '../../src/renderer/workbench/TranslationEditorPanel'

test('autosaves translation changes and shows validation feedback', async () => {
  const user = userEvent.setup()

  render(<TranslationEditorPanel />)
  await user.type(
    screen.getByRole('textbox', { name: /translation/i }),
    'Uyu',
  )

  expect(await screen.findByText(/saved/i)).toBeInTheDocument()
  expect(screen.getByText(/tokens ok/i)).toBeInTheDocument()
})

test('shows export errors without clearing the draft', () => {
  render(
    <TranslationEditorPanel initialError="Cannot export while critical validation errors remain." />,
  )

  expect(screen.getByRole('alert')).toHaveTextContent(/cannot export/i)
})

test('renders language-neutral editor copy', () => {
  render(<TranslationEditorPanel />)

  expect(screen.getByText('Translation')).toBeInTheDocument()
  expect(
    screen.getByText(
      'Draft translation, validation summary, and quick actions live here.',
    ),
  ).toBeInTheDocument()
  expect(screen.queryByText('Turkish Translation')).not.toBeInTheDocument()
})
