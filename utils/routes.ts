export interface IRoute {
  path: string;
  params: string[];
}

export const routes = {
  createFanout: { path: "/", params: [] },
  fanout: { path: "/fanout/:name", params: ["name"] },
  addMember: { path: "/fanout/:name/add", params: ["name"] },
};

export function route(
  route: IRoute,
  params: Record<string, string | undefined>
): string {
  return route.params.reduce((acc, param) => {
    if (params[param]) return acc.replaceAll(`:${param}`, params[param]!);
    return acc;
  }, route.path);
}
