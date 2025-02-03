type User = {
  id: string;
};
export function useUser(): User | null {
  const match = document.cookie.match(/userId=(?<id>[^;]+);?$/);
  if (match?.groups?.id) {
    return { id: match.groups.id };
  }
  return null;
}
