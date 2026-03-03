export type PortalIdentity = {
  username: string;
  displayName: string;
};

export const PORTAL_IDENTITIES: PortalIdentity[] = [
  { username: "jayton", displayName: "Jayton" },
  { username: "dillon", displayName: "Dillon" },
  { username: "nick", displayName: "Nick" }
];

export function buildFavoriteTabs(currentUsername: string) {
  const currentUser = PORTAL_IDENTITIES.find(
    (identity) => identity.username === currentUsername
  );
  const otherTabs = PORTAL_IDENTITIES.filter(
    (identity) => identity.username !== currentUsername
  ).map((identity) => ({
    key: identity.username,
    label: `${identity.displayName}'s Favorites`
  }));

  return [
    {
      key: "mine",
      label: currentUser ? "My Favorites" : "Favorites"
    },
    ...otherTabs
  ];
}
