import type { Constituency } from '../../src/app/parliament/types';

type Binding = Record<string, { value: string } | undefined>;

export const buildConstituencyFromBinding = (
  binding: Binding
): Constituency | null => {
  if (!binding.constituency) return null;
  return {
    id: binding.constituency.value,
    label: binding.constituencyLabel?.value ?? binding.constituency.value,
  };
};
