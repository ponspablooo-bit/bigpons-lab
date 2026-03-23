import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      ...body,
      model: "claude-haiku-4-5-20251001",
    }),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
```

Y en **`app/page.jsx`** buscá con Ctrl+F esta línea:
```
model:"claude-sonnet-4-20250514"
```
Y cambiala por:
```
model:"claude-haiku-4-5-20251001"
