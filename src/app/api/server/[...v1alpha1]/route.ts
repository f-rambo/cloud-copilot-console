export const dynamic = 'force-dynamic';

const backendUrl = `${process.env.NEXT_PUBLIC_API ?? ''}${
  process.env.NEXT_PUBLIC_API_VERSION ?? ''
}`;

const accessToken = '';
const provider = '';
const email = '';
const userId = '';

export async function GET(request: Request) {
  const url = new URL(request.url);

  url.pathname = url.pathname.replace(/\/.*\/backend/, '');

  const newUrl = backendUrl + url.pathname;
  const serachParanms = new URLSearchParams(url.searchParams).toString();
  const newHeaders = new Headers(request.headers);
  newHeaders.append('Authorization', provider + ' ' + accessToken);
  newHeaders.append('User-Email', email);
  newHeaders.append('User-Id', userId);

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
      headers: newHeaders
    }
  );

  return forwardedResponse;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/\/.*\/backend/, '');

  const newUrl = backendUrl + url.pathname;
  const newHeaders = new Headers(request.headers);
  newHeaders.append('Authorization', provider + ' ' + accessToken);
  newHeaders.append('User-Email', email);
  newHeaders.append('User-Id', userId);

  const forwardedResponse = await fetch(newUrl, {
    method: 'POST',
    headers: newHeaders,
    body: await request.clone().text()
  });

  return forwardedResponse;
}

export async function PUT(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/\/.*\/backend/, '');

  const newUrl = backendUrl + url.pathname;
  const newHeaders = new Headers(request.headers);
  newHeaders.append('Authorization', provider + ' ' + accessToken);
  newHeaders.append('User-Email', email);
  newHeaders.append('User-Id', userId);

  const forwardedResponse = await fetch(newUrl, {
    method: 'PUT',
    headers: newHeaders,
    body: await request.clone().text()
  });

  return forwardedResponse;
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/\/.*\/backend/, '');

  const newUrl = backendUrl + url.pathname;
  const newHeaders = new Headers(request.headers);

  const serachParanms = new URLSearchParams(url.searchParams).toString();
  newHeaders.append('Authorization', provider + ' ' + accessToken);
  newHeaders.append('User-Email', email);
  newHeaders.append('User-Id', userId);

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
      headers: newHeaders
    }
  );

  return forwardedResponse;
}
