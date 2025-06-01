const serverUrl = `${process.env.SERVER_API_URL ?? ''}${
  process.env.API_VERSION ?? ''
}`;

export async function GET(request: Request) {
  const url = new URL(request.url);

  url.pathname = url.pathname.replace(/\/.*\/server/, '');

  const newUrl = serverUrl + url.pathname;
  const serachParanms = new URLSearchParams(url.searchParams).toString();

  const encodedSearchParams = serachParanms
    .split('&')
    .map((param) => {
      const [key, value] = param.split('=');
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');

  const forwardedResponse = await fetch(
    newUrl + (encodedSearchParams ? '?' + encodedSearchParams : ''),
    {
      method: 'GET',
      headers: request.headers
    }
  );

  return forwardedResponse;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/\/.*\/server/, '');

  const newUrl = serverUrl + url.pathname;

  const forwardedResponse = await fetch(newUrl, {
    method: 'POST',
    headers: request.headers,
    body: await request.clone().text()
  });

  return forwardedResponse;
}

export async function PUT(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/\/.*\/server/, '');

  const newUrl = serverUrl + url.pathname;

  const forwardedResponse = await fetch(newUrl, {
    method: 'PUT',
    headers: request.headers,
    body: await request.clone().text()
  });

  return forwardedResponse;
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/\/.*\/server/, '');

  const newUrl = serverUrl + url.pathname;

  const serachParanms = new URLSearchParams(url.searchParams).toString();

  const encodedSearchParams = serachParanms
    .split('&')
    .map((param) => {
      const [key, value] = param.split('=');
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');

  const forwardedResponse = await fetch(
    newUrl + (encodedSearchParams ? '?' + encodedSearchParams : ''),
    {
      method: 'DELETE',
      headers: request.headers
    }
  );

  return forwardedResponse;
}
