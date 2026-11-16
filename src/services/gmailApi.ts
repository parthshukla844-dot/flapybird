export class GmailApiError extends Error {
  public status: number;
  public isAuthError: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'GmailApiError';
    this.status = status;
    this.isAuthError = status === 401;
  }
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailLabel {
  id: string;
  name: string;
  type?: string;
  messagesUnread?: number;
  messagesTotal?: number;
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  isUnread: boolean;
}

export interface GmailMessageDetail extends GmailMessageSummary {
  textBody: string;
  htmlBody: string;
  messageIdHeader?: string;
}

interface GmailPayloadPart {
  mimeType?: string;
  body?: { data?: string; size?: number };
  headers?: GmailMessageHeader[];
  parts?: GmailPayloadPart[];
}

interface GmailRawMessageResponse {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: GmailPayloadPart;
}

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

async function gmailFetch<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${GMAIL_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let errorMessage = `Gmail API error (${res.status})`;
    try {
      const errData = await res.json();
      if (errData?.error?.message) {
        errorMessage = errData.error.message;
      }
    } catch {
      // ignore JSON parse failure
    }
    throw new GmailApiError(errorMessage, res.status);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json() as Promise<T>;
}

function decodeBase64Url(base64Url: string): string {
  try {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    const binaryStr = atob(padded);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return '';
  }
}

function encodeBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function getHeader(headers: GmailMessageHeader[] | undefined, name: string): string {
  if (!headers) return '';
  const target = name.toLowerCase();
  const found = headers.find((h) => h.name.toLowerCase() === target);
  return found?.value || '';
}

function extractBodyParts(part?: GmailPayloadPart): { textBody: string; htmlBody: string } {
  if (!part) return { textBody: '', htmlBody: '' };

  let textBody = '';
  let htmlBody = '';

  if (part.mimeType === 'text/plain' && part.body?.data) {
    textBody = decodeBase64Url(part.body.data);
  } else if (part.mimeType === 'text/html' && part.body?.data) {
    htmlBody = decodeBase64Url(part.body.data);
  }

  if (part.parts && Array.isArray(part.parts)) {
    for (const subPart of part.parts) {
      const sub = extractBodyParts(subPart);
      if (sub.textBody && !textBody) textBody = sub.textBody;
      if (sub.htmlBody && !htmlBody) htmlBody = sub.htmlBody;
    }
  }

  if (!textBody && !htmlBody && part.body?.data) {
    textBody = decodeBase64Url(part.body.data);
  }

  return { textBody, htmlBody };
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export async function fetchGmailProfile(accessToken: string): Promise<GmailProfile> {
  return gmailFetch<GmailProfile>('/profile', accessToken);
}

export async function fetchGmailLabels(accessToken: string): Promise<GmailLabel[]> {
  const data = await gmailFetch<{ labels?: GmailLabel[] }>('/labels', accessToken);
  return data.labels || [];
}

export async function listGmailMessages(
  accessToken: string,
  params: { labelId?: string; q?: string; maxResults?: number } = {}
): Promise<GmailMessageSummary[]> {
  const query = new URLSearchParams();
  query.set('maxResults', String(params.maxResults ?? 15));
  if (params.labelId && params.labelId !== 'ALL') {
    query.set('labelIds', params.labelId);
  }
  if (params.q && params.q.trim()) {
    query.set('q', params.q.trim());
  }

  const listData = await gmailFetch<{ messages?: Array<{ id: string; threadId: string }> }>(
    `/messages?${query.toString()}`,
    accessToken
  );

  const ids = listData.messages || [];
  if (ids.length === 0) return [];

  const details = await Promise.all(
    ids.map((m) =>
      gmailFetch<GmailRawMessageResponse>(
        `/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`,
        accessToken
      )
    )
  );

  return details.map((msg) => {
    const headers = msg.payload?.headers;
    const labelIds = msg.labelIds || [];
    return {
      id: msg.id,
      threadId: msg.threadId,
      labelIds,
      snippet: decodeHtmlEntities(msg.snippet || ''),
      internalDate: msg.internalDate || '',
      from: getHeader(headers, 'From') || '(Unknown Sender)',
      to: getHeader(headers, 'To'),
      subject: getHeader(headers, 'Subject') || '(No Subject)',
      date: getHeader(headers, 'Date'),
      isUnread: labelIds.includes('UNREAD'),
    };
  });
}

export async function fetchGmailMessageDetail(
  accessToken: string,
  messageId: string
): Promise<GmailMessageDetail> {
  const msg = await gmailFetch<GmailRawMessageResponse>(
    `/messages/${messageId}?format=full`,
    accessToken
  );

  const headers = msg.payload?.headers;
  const labelIds = msg.labelIds || [];
  const { textBody, htmlBody } = extractBodyParts(msg.payload);

  return {
    id: msg.id,
    threadId: msg.threadId,
    labelIds,
    snippet: decodeHtmlEntities(msg.snippet || ''),
    internalDate: msg.internalDate || '',
    from: getHeader(headers, 'From') || '(Unknown Sender)',
    to: getHeader(headers, 'To'),
    subject: getHeader(headers, 'Subject') || '(No Subject)',
    date: getHeader(headers, 'Date'),
    isUnread: labelIds.includes('UNREAD'),
    textBody,
    htmlBody,
    messageIdHeader: getHeader(headers, 'Message-ID') || getHeader(headers, 'Message-Id'),
  };
}

function buildRawEmail(params: {
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
}): string {
  const cleanTo = params.to.replace(/[\r\n]/g, '').trim();
  const cleanSubject = params.subject.replace(/[\r\n]/g, '').trim();
  const encodedSubject = `=?UTF-8?B?${btoa(
    Array.from(new TextEncoder().encode(cleanSubject))
      .map((b) => String.fromCharCode(b))
      .join('')
  )}?=`;

  const headers = [
    `To: ${cleanTo}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
  ];

  if (params.inReplyTo) {
    headers.push(`In-Reply-To: ${params.inReplyTo}`);
    headers.push(`References: ${params.inReplyTo}`);
  }

  const rawMessage = `${headers.join('\r\n')}\r\n\r\n${params.body}`;
  return encodeBase64Url(rawMessage);
}

export async function sendGmailMessage(
  accessToken: string,
  params: {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
    inReplyTo?: string;
  }
): Promise<{ id: string; threadId: string }> {
  const raw = buildRawEmail(params);
  const payload: { raw: string; threadId?: string } = { raw };
  if (params.threadId) {
    payload.threadId = params.threadId;
  }
  return gmailFetch<{ id: string; threadId: string }>('/messages/send', accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createGmailDraft(
  accessToken: string,
  params: {
    to: string;
    subject: string;
    body: string;
    threadId?: string;
  }
): Promise<{ id: string }> {
  const raw = buildRawEmail(params);
  return gmailFetch<{ id: string }>('/drafts', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      message: {
        raw,
        ...(params.threadId ? { threadId: params.threadId } : {}),
      },
    }),
  });
}

export async function trashGmailMessage(
  accessToken: string,
  messageId: string
): Promise<void> {
  await gmailFetch(`/messages/${messageId}/trash`, accessToken, {
    method: 'POST',
  });
}

export async function modifyGmailMessageLabels(
  accessToken: string,
  messageId: string,
  params: { addLabelIds?: string[]; removeLabelIds?: string[] }
): Promise<void> {
  await gmailFetch(`/messages/${messageId}/modify`, accessToken, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
