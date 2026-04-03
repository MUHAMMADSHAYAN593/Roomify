export async function loader() {
  return new Response("{}", {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export default function ChromeDevtoolsRoute() {
  return null;
}
