type ClassInput =
  | string
  | number
  | false
  | null
  | undefined
  | ClassInput[]
  | { [key: string]: boolean | null | undefined };

const toTokens = (input: ClassInput): string[] => {
  if (!input) {
    return [];
  }

  if (typeof input === 'string' || typeof input === 'number') {
    return [String(input)];
  }

  if (Array.isArray(input)) {
    return input.flatMap(toTokens);
  }

  return Object.entries(input)
    .filter(([, enabled]) => Boolean(enabled))
    .map(([token]) => token);
};

export function cn(...classes: ClassInput[]) {
  return classes
    .flatMap(toTokens)
    .join(' ')
    .trim();
}
