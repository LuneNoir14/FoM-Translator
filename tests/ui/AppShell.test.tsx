import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import App from '../../src/App'

test('renders the compact brand header with logo artwork', () => {
  render(<App />)

  const logo = screen.getByAltText('Fields of Mistria Translator logo')

  expect(logo).toBeInTheDocument()
  expect(logo).toHaveAttribute('src', './applogo.png')
  expect(screen.getByText('Work session')).toBeInTheDocument()
  expect(screen.getByText('Demo workspace loaded')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Open Project' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Export JSON' })).toBeInTheDocument()
})

test('uses the hidden file picker fallback when the desktop bridge is unavailable', async () => {
  const user = userEvent.setup()

  render(<App />)

  const fallbackInput = screen.getByTestId('fallback-project-input')
  const clickSpy = vi.spyOn(fallbackInput, 'click').mockImplementation(() => {})

  await user.click(screen.getByRole('button', { name: 'Open Project' }))

  expect(clickSpy).toHaveBeenCalled()
})

test('renders toolbar and three primary panels', () => {
  render(<App />)

  expect(screen.getByRole('banner')).toBeInTheDocument()
  expect(screen.getByTestId('entry-list-panel')).toBeInTheDocument()
  expect(screen.getByTestId('source-viewer-panel')).toBeInTheDocument()
  expect(screen.getByTestId('translation-editor-panel')).toBeInTheDocument()
  expect(screen.getByText('Source Text')).toBeInTheDocument()
  expect(screen.queryByText('Source English')).not.toBeInTheDocument()
})
