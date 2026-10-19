export type PersonName = {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
};

export function formatPersonName({ firstName, middleName, lastName }: PersonName) {
  return [firstName, middleName, lastName]
    .map(part => part?.trim())
    .filter(Boolean)
    .join(" ");
}

