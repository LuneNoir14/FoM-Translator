const TOKEN_PATTERN = /\[[^\]]+\]|\$[^$]+\$|=[^=]+=|\\n/g

export function tokenizeText(text: string) {
  return (text.match(TOKEN_PATTERN) ?? []) as string[]
}

export function countLiteralLineBreaks(text: string) {
  return tokenizeText(text).filter((token) => token === '\\n').length
}
