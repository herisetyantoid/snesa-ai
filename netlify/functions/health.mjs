export default async () => {
  return Response.json({
    ok: true,
    service: "SNESA AI",
    status: "online"
  });
};

export const config = {
  path: "/api/health"
};
