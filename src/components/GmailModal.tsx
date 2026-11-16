import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  X,
  Search,
  RefreshCw,
  Send,
  Trash2,
  ArrowLeft,
  Reply,
  Inbox,
  Star,
  FileText,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  MailOpen,
  MailCheck,
  Loader2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  GmailProfile,
  GmailMessageSummary,
  GmailMessageDetail,
  GmailApiError,
  fetchGmailProfile,
  listGmailMessages,
  fetchGmailMessageDetail,
  sendGmailMessage,
  createGmailDraft,
  trashGmailMessage,
  modifyGmailMessageLabels,
} from '../services/gmailApi';
import { clearAccessToken } from '../services/gmailAuth';
import { retroAudio } from '../game/audio';

export interface GmailComposeSeed {
  to?: string;
  subject?: string;
  body?: string;
}

interface GmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  authError: string | null;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
  onRequireReauth: () => void;
  initialTab?: 'inbox' | 'compose';
  initialCompose?: GmailComposeSeed | null;
  gameContext: {
    score: number;
    highScore: number;
    totalCoins: number;
    skinName: string;
    biomeName: string;
    difficulty: string;
  };
}

type PendingMutation =
  | {
      kind: 'send';
      to: string;
      subject: string;
      body: string;
      threadId?: string;
      inReplyTo?: string;
    }
  | {
      kind: 'draft';
      to: string;
      subject: string;
      body: string;
      threadId?: string;
    }
  | {
      kind: 'trash';
      message: GmailMessageSummary | GmailMessageDetail;
    }
  | {
      kind: 'toggleRead';
      message: GmailMessageSummary | GmailMessageDetail;
      markAsRead: boolean;
    };

const LABEL_FILTERS = [
  { id: 'INBOX', label: 'INBOX', icon: Inbox },
  { id: 'SENT', label: 'SENT', icon: Send },
  { id: 'STARRED', label: 'STARRED', icon: Star },
  { id: 'DRAFT', label: 'DRAFTS', icon: FileText },
] as const;

export const GmailModal: React.FC<GmailModalProps> = ({
  isOpen,
  onClose,
  user,
  accessToken,
  needsAuth,
  isLoggingIn,
  authError,
  onLogin,
  onLogout,
  onRequireReauth,
  initialTab = 'inbox',
  initialCompose = null,
  gameContext,
}) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose'>(initialTab);
  const [profile, setProfile] = useState<GmailProfile | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>('INBOX');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [appliedQuery, setAppliedQuery] = useState<string>('');
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageDetail | null>(null);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Compose state
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [replyThreadId, setReplyThreadId] = useState<string | undefined>(undefined);
  const [replyMessageIdHeader, setReplyMessageIdHeader] = useState<string | undefined>(undefined);

  // Explicit confirmation dialog state for all mutating/destructive operations
  const [pendingMutation, setPendingMutation] = useState<PendingMutation | null>(null);

  // Sync initial tab / pre-filled compose draft whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setStatusBanner(null);
    if (initialCompose) {
      setComposeTo(initialCompose.to || '');
      setComposeSubject(initialCompose.subject || '');
      setComposeBody(initialCompose.body || '');
      setReplyThreadId(undefined);
      setReplyMessageIdHeader(undefined);
    }
  }, [isOpen, initialTab, initialCompose]);

  const handleApiError = useCallback(
    (err: unknown, fallbackMessage: string) => {
      if (err instanceof GmailApiError && err.isAuthError) {
        clearAccessToken();
        onRequireReauth();
        setStatusBanner({
          type: 'error',
          text: 'Your Google session expired. Please sign in with Google again.',
        });
        return;
      }
      const message = err instanceof Error ? err.message : fallbackMessage;
      setStatusBanner({ type: 'error', text: message });
    },
    [onRequireReauth]
  );

  const loadInboxData = useCallback(async () => {
    if (!accessToken) return;
    setLoadingList(true);
    setStatusBanner(null);
    try {
      const [prof, list] = await Promise.all([
        profile ? Promise.resolve(profile) : fetchGmailProfile(accessToken),
        listGmailMessages(accessToken, {
          labelId: selectedLabel,
          q: appliedQuery,
          maxResults: 15,
        }),
      ]);
      setProfile(prof);
      setMessages(list);
    } catch (err) {
      handleApiError(err, 'Failed to load Gmail messages.');
    } finally {
      setLoadingList(false);
    }
  }, [accessToken, selectedLabel, appliedQuery, profile, handleApiError]);

  useEffect(() => {
    if (isOpen && accessToken && !needsAuth && activeTab === 'inbox') {
      loadInboxData();
    }
  }, [isOpen, accessToken, needsAuth, activeTab, selectedLabel, appliedQuery, loadInboxData]);

  const handleOpenMessage = async (msg: GmailMessageSummary) => {
    if (!accessToken) return;
    retroAudio.playSelect();
    setLoadingDetail(true);
    setStatusBanner(null);
    try {
      const detail = await fetchGmailMessageDetail(accessToken, msg.id);
      setSelectedMessage(detail);
    } catch (err) {
      handleApiError(err, 'Failed to open email.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStartReply = (detail: GmailMessageDetail) => {
    retroAudio.playSelect();
    const replyToAddress = detail.from;
    const subject = detail.subject.toLowerCase().startsWith('re:')
      ? detail.subject
      : `Re: ${detail.subject}`;
    setComposeTo(replyToAddress);
    setComposeSubject(subject);
    setComposeBody(
      `\n\n--- On ${detail.date || 'earlier'}, ${detail.from} wrote: ---\n${
        detail.textBody || detail.snippet
      }`
    );
    setReplyThreadId(detail.threadId);
    setReplyMessageIdHeader(detail.messageIdHeader);
    setActiveTab('compose');
  };

  const handleInsertScoreCard = () => {
    retroAudio.playSelect();
    const scoreBlock = [
      '=== FLAPPY PIXEL (FLAP_GEN.OS) FLIGHT REPORT ===',
      `Best Score: ${gameContext.highScore} pts`,
      `Latest Run Score: ${gameContext.score} pts`,
      `Coins Bank: ${gameContext.totalCoins}¢`,
      `Equipped Avatar: ${gameContext.skinName}`,
      `Weather Realm: ${gameContext.biomeName}`,
      `Difficulty: ${gameContext.difficulty.toUpperCase()}`,
      '================================================',
      '',
      'Think you can beat my high score? Give it a try!',
    ].join('\n');

    setComposeSubject((prev) =>
      prev.trim() ? prev : `Flappy Pixel Challenge: Can you beat ${gameContext.highScore} pts?`
    );
    setComposeBody((prev) => (prev.trim() ? `${prev.trim()}\n\n${scoreBlock}` : scoreBlock));
  };

  const requestSendConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusBanner(null);
    if (!composeTo.trim()) {
      setStatusBanner({ type: 'error', text: 'Please enter a recipient email address.' });
      return;
    }
    if (!composeSubject.trim()) {
      setStatusBanner({ type: 'error', text: 'Please enter an email subject.' });
      return;
    }
    retroAudio.playSelect();
    setPendingMutation({
      kind: 'send',
      to: composeTo.trim(),
      subject: composeSubject.trim(),
      body: composeBody,
      threadId: replyThreadId,
      inReplyTo: replyMessageIdHeader,
    });
  };

  const requestDraftConfirmation = () => {
    setStatusBanner(null);
    if (!composeTo.trim() && !composeSubject.trim() && !composeBody.trim()) {
      setStatusBanner({ type: 'error', text: 'Draft is empty. Add a recipient, subject, or body first.' });
      return;
    }
    retroAudio.playSelect();
    setPendingMutation({
      kind: 'draft',
      to: composeTo.trim(),
      subject: composeSubject.trim() || '(No Subject)',
      body: composeBody,
      threadId: replyThreadId,
    });
  };

  const executePendingMutation = async () => {
    if (!pendingMutation || !accessToken) return;
    setMutating(true);
    setStatusBanner(null);

    try {
      if (pendingMutation.kind === 'send') {
        await sendGmailMessage(accessToken, {
          to: pendingMutation.to,
          subject: pendingMutation.subject,
          body: pendingMutation.body,
          threadId: pendingMutation.threadId,
          inReplyTo: pendingMutation.inReplyTo,
        });
        retroAudio.playPowerUp();
        setStatusBanner({
          type: 'success',
          text: `Email sent successfully to ${pendingMutation.to}!`,
        });
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
        setReplyThreadId(undefined);
        setReplyMessageIdHeader(undefined);
        setActiveTab('inbox');
      } else if (pendingMutation.kind === 'draft') {
        await createGmailDraft(accessToken, {
          to: pendingMutation.to,
          subject: pendingMutation.subject,
          body: pendingMutation.body,
          threadId: pendingMutation.threadId,
        });
        retroAudio.playCoin();
        setStatusBanner({
          type: 'success',
          text: 'Draft saved to your Gmail Drafts folder.',
        });
      } else if (pendingMutation.kind === 'trash') {
        await trashGmailMessage(accessToken, pendingMutation.message.id);
        retroAudio.playSelect();
        setMessages((prev) => prev.filter((m) => m.id !== pendingMutation.message.id));
        if (selectedMessage?.id === pendingMutation.message.id) {
          setSelectedMessage(null);
        }
        setStatusBanner({
          type: 'success',
          text: 'Email moved to Gmail Trash.',
        });
      } else if (pendingMutation.kind === 'toggleRead') {
        const msg = pendingMutation.message;
        await modifyGmailMessageLabels(accessToken, msg.id, {
          addLabelIds: pendingMutation.markAsRead ? [] : ['UNREAD'],
          removeLabelIds: pendingMutation.markAsRead ? ['UNREAD'] : [],
        });
        retroAudio.playSelect();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id ? { ...m, isUnread: !pendingMutation.markAsRead } : m
          )
        );
        if (selectedMessage?.id === msg.id) {
          setSelectedMessage({
            ...selectedMessage,
            isUnread: !pendingMutation.markAsRead,
          });
        }
        setStatusBanner({
          type: 'success',
          text: pendingMutation.markAsRead
            ? 'Marked email as read.'
            : 'Marked email as unread.',
        });
      }
      setPendingMutation(null);
    } catch (err) {
      setPendingMutation(null);
      handleApiError(err, 'Failed to complete Gmail action.');
    } finally {
      setMutating(false);
    }
  };

  if (!isOpen) return null;

  const isAuthenticated = Boolean(user && accessToken && !needsAuth);

  return (
    <div
      id="gmail-modal-backdrop"
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 md:p-6 backdrop-blur-xs font-mono text-white select-text touch-auto"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        id="gmail-modal-dialog"
        className="relative flex flex-col w-full max-w-3xl max-h-[92vh] rounded-2xl border-4 border-[#ea4335] bg-[#0d0d0d] shadow-[0_0_50px_rgba(234,67,53,0.35)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-white/15 bg-black/95 px-4 py-3 sm:px-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 sm:size-9 items-center justify-center rounded-lg bg-[#ea4335] text-white shadow-[0_0_12px_rgba(234,67,53,0.6)]">
              <Mail className="size-4 sm:size-5" />
            </div>
            <div>
              <h2 className="font-mono text-base sm:text-xl font-black italic tracking-tighter text-white">
                ARCADE_MAIL<span className="text-[#ea4335]">.GMAIL</span>
              </h2>
              <p className="text-[9px] sm:text-[10px] text-white/50 truncate max-w-[200px] sm:max-w-xs">
                {isAuthenticated
                  ? profile?.emailAddress || user?.email || 'Connected to Gmail'
                  : 'Connect Gmail to read messages & share scores'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                id="btn-gmail-logout"
                onClick={() => {
                  retroAudio.playSelect();
                  setProfile(null);
                  setMessages([]);
                  setSelectedMessage(null);
                  onLogout();
                }}
                className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-2.5 py-1.5 text-[10px] sm:text-xs font-bold text-white/80 hover:border-[#ea4335] hover:text-[#ea4335] cursor-pointer transition-colors"
                title="Disconnect / Sign out"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">SIGN OUT</span>
              </button>
            )}

            <button
              type="button"
              id="btn-gmail-close"
              onClick={() => {
                retroAudio.playSelect();
                onClose();
              }}
              className="flex size-8 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white/70 hover:border-white hover:text-white cursor-pointer"
              title="Close Gmail"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Status Banner */}
        {(statusBanner || authError) && (
          <div
            className={`px-4 py-2 text-xs font-bold flex items-center justify-between gap-2 border-b border-white/10 shrink-0 ${
              statusBanner?.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300'
                : 'bg-red-950/80 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusBanner?.type === 'success' ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="size-4 shrink-0 text-red-400" />
              )}
              <span>{statusBanner?.text || authError}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-white/50 hover:text-white cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Body */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center space-y-5">
            <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-[#ea4335]/60 bg-[#ea4335]/15 text-[#ea4335] shadow-[0_0_30px_rgba(234,67,53,0.25)]">
              <Mail className="size-8" />
            </div>

            <div className="space-y-2 max-w-md">
              <h3 className="text-lg sm:text-xl font-black text-white">
                CONNECT YOUR GMAIL ACCOUNT
              </h3>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
                Sign in with Google to browse your Gmail inbox, search messages, send high-score challenges to friends, and manage emails directly inside Flappy Pixel.
              </p>
            </div>

            <button
              type="button"
              id="btn-google-signin"
              className="gsi-material-button"
              disabled={isLoggingIn}
              onClick={() => {
                retroAudio.playSelect();
                onLogin();
              }}
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
                </span>
                <span style={{ display: 'none' }}>Sign in with Google</span>
              </div>
            </button>

            <p className="text-[10px] text-white/40 max-w-sm">
              Every email send, draft save, or message deletion asks for your explicit confirmation first. If Google shows an &ldquo;app is currently being tested&rdquo; notice, click <strong>Continue</strong> to proceed.
            </p>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex items-center justify-between gap-2 border-b border-white/15 bg-[#121212] px-4 py-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-gmail-tab-inbox"
                  onClick={() => {
                    retroAudio.playSelect();
                    setActiveTab('inbox');
                    setSelectedMessage(null);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'inbox'
                      ? 'border-[#ea4335] bg-[#ea4335] text-white'
                      : 'border-white/15 bg-black/60 text-white/70 hover:text-white'
                  }`}
                >
                  <Inbox className="size-3.5" />
                  <span>MAILBOX</span>
                </button>

                <button
                  type="button"
                  id="btn-gmail-tab-compose"
                  onClick={() => {
                    retroAudio.playSelect();
                    setActiveTab('compose');
                  }}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                    activeTab === 'compose'
                      ? 'border-[#f7d302] bg-[#f7d302] text-black'
                      : 'border-white/15 bg-black/60 text-white/70 hover:text-white'
                  }`}
                >
                  <Send className="size-3.5" />
                  <span>COMPOSE / SHARE SCORE</span>
                </button>
              </div>

              {profile && (
                <span className="hidden sm:inline text-[10px] text-white/50">
                  {profile.messagesTotal.toLocaleString()} total msgs
                </span>
              )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4">
              {activeTab === 'inbox' ? (
                selectedMessage ? (
                  /* Message Reader View */
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-3">
                      <button
                        type="button"
                        onClick={() => {
                          retroAudio.playSelect();
                          setSelectedMessage(null);
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/15 cursor-pointer"
                      >
                        <ArrowLeft className="size-3.5" />
                        <span>BACK TO LIST</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartReply(selectedMessage)}
                          className="flex items-center gap-1.5 rounded-lg border border-[#f7d302]/60 bg-[#f7d302]/15 px-2.5 py-1.5 text-xs font-bold text-[#f7d302] hover:bg-[#f7d302] hover:text-black cursor-pointer"
                        >
                          <Reply className="size-3.5" />
                          <span>REPLY</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            retroAudio.playSelect();
                            setPendingMutation({
                              kind: 'toggleRead',
                              message: selectedMessage,
                              markAsRead: selectedMessage.isUnread,
                            });
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-[#4ec0ca]/60 bg-[#4ec0ca]/15 px-2.5 py-1.5 text-xs font-bold text-[#4ec0ca] hover:bg-[#4ec0ca] hover:text-black cursor-pointer"
                        >
                          {selectedMessage.isUnread ? (
                            <>
                              <MailCheck className="size-3.5" />
                              <span>MARK READ</span>
                            </>
                          ) : (
                            <>
                              <MailOpen className="size-3.5" />
                              <span>MARK UNREAD</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            retroAudio.playSelect();
                            setPendingMutation({
                              kind: 'trash',
                              message: selectedMessage,
                            });
                          }}
                          className="flex items-center gap-1.5 rounded-lg border border-[#ef4444]/60 bg-[#ef4444]/15 px-2.5 py-1.5 text-xs font-bold text-[#ef4444] hover:bg-[#ef4444] hover:text-white cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                          <span>TRASH</span>
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/15 bg-black/70 p-3 sm:p-4 space-y-2">
                      <h3 className="text-sm sm:text-base font-black text-white">
                        {selectedMessage.subject}
                      </h3>
                      <div className="text-[11px] text-white/70 space-y-0.5 border-b border-white/10 pb-2">
                        <div>
                          <span className="text-white/40">FROM: </span>
                          <span className="text-white font-bold">{selectedMessage.from}</span>
                        </div>
                        {selectedMessage.to && (
                          <div>
                            <span className="text-white/40">TO: </span>
                            <span>{selectedMessage.to}</span>
                          </div>
                        )}
                        {selectedMessage.date && (
                          <div>
                            <span className="text-white/40">DATE: </span>
                            <span>{selectedMessage.date}</span>
                          </div>
                        )}
                      </div>

                      {selectedMessage.textBody ? (
                        <pre className="whitespace-pre-wrap break-words font-sans text-xs sm:text-sm text-white/90 leading-relaxed pt-1">
                          {selectedMessage.textBody}
                        </pre>
                      ) : selectedMessage.htmlBody ? (
                        <iframe
                          title="Email Body"
                          sandbox=""
                          srcDoc={selectedMessage.htmlBody}
                          className="w-full h-72 rounded-lg border border-white/15 bg-white"
                        />
                      ) : (
                        <p className="text-xs text-white/60 italic">
                          {selectedMessage.snippet || '(Empty message body)'}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Mailbox List View */
                  <div className="space-y-3">
                    {/* Controls Row: Labels + Search */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        {LABEL_FILTERS.map((lbl) => {
                          const Icon = lbl.icon;
                          const isSelected = selectedLabel === lbl.id;
                          return (
                            <button
                              key={lbl.id}
                              type="button"
                              onClick={() => {
                                retroAudio.playSelect();
                                setSelectedLabel(lbl.id);
                              }}
                              className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] sm:text-xs font-bold cursor-pointer transition-colors ${
                                isSelected
                                  ? 'border-[#4ec0ca] bg-[#4ec0ca]/20 text-[#4ec0ca]'
                                  : 'border-white/15 bg-black/60 text-white/60 hover:text-white'
                              }`}
                            >
                              <Icon className="size-3" />
                              <span>{lbl.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <form
                        className="flex items-center gap-1.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          setAppliedQuery(searchQuery);
                        }}
                      >
                        <div className="relative flex-1 sm:w-52">
                          <Search className="size-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Gmail..."
                            className="w-full rounded-lg border border-white/20 bg-black pl-8 pr-2.5 py-1.5 text-xs text-white placeholder:text-white/40 focus:border-[#4ec0ca] focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/20 cursor-pointer"
                        >
                          GO
                        </button>
                        <button
                          type="button"
                          onClick={() => loadInboxData()}
                          disabled={loadingList}
                          className="flex items-center justify-center rounded-lg border border-white/20 bg-white/10 p-1.5 text-white hover:bg-white/20 cursor-pointer disabled:opacity-50"
                          title="Refresh Mailbox"
                        >
                          <RefreshCw className={`size-3.5 ${loadingList ? 'animate-spin' : ''}`} />
                        </button>
                      </form>
                    </div>

                    {/* Messages List */}
                    {loadingList || loadingDetail ? (
                      <div className="flex flex-col items-center justify-center py-14 text-white/60 gap-2">
                        <Loader2 className="size-6 animate-spin text-[#ea4335]" />
                        <span className="text-xs font-bold">
                          {loadingDetail ? 'LOADING EMAIL...' : 'FETCHING GMAIL MESSAGES...'}
                        </span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-black/50 py-12 text-center text-xs text-white/50">
                        No messages found in {selectedLabel}
                        {appliedQuery ? ` matching "${appliedQuery}"` : ''}.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`group flex items-start justify-between gap-2 rounded-xl border p-2.5 sm:p-3 transition-colors cursor-pointer ${
                              msg.isUnread
                                ? 'border-[#ea4335]/50 bg-[#ea4335]/10 hover:bg-[#ea4335]/15'
                                : 'border-white/10 bg-black/70 hover:border-white/30 hover:bg-white/5'
                            }`}
                            onClick={() => handleOpenMessage(msg)}
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-2">
                                {msg.isUnread && (
                                  <span className="size-2 rounded-full bg-[#ea4335] shrink-0" />
                                )}
                                <span
                                  className={`text-xs truncate ${
                                    msg.isUnread ? 'font-black text-white' : 'font-bold text-white/80'
                                  }`}
                                >
                                  {msg.from}
                                </span>
                              </div>
                              <p
                                className={`text-xs truncate ${
                                  msg.isUnread ? 'font-bold text-[#f7d302]' : 'text-white/90'
                                }`}
                              >
                                {msg.subject}
                              </p>
                              <p className="text-[10px] sm:text-[11px] text-white/50 truncate">
                                {msg.snippet}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  retroAudio.playSelect();
                                  setPendingMutation({
                                    kind: 'trash',
                                    message: msg,
                                  });
                                }}
                                className="rounded-md p-1.5 text-white/40 hover:bg-[#ef4444]/20 hover:text-[#ef4444] cursor-pointer"
                                title="Move to Trash"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* Compose / Share Score View */
                <form onSubmit={requestSendConfirmation} className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#f7d302]/30 bg-[#f7d302]/10 p-2.5">
                    <div className="flex items-center gap-2 text-xs text-[#f7d302] font-bold">
                      <Trophy className="size-4 shrink-0" />
                      <span>Challenge friends or email yourself your Flappy Pixel run stats!</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleInsertScoreCard}
                      className="rounded-lg border border-[#f7d302] bg-[#f7d302] px-2.5 py-1 text-[10px] sm:text-xs font-black text-black hover:bg-[#ffe338] cursor-pointer"
                    >
                      + INSERT SCORE CARD
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60">
                      To (Recipient Email)
                    </label>
                    <input
                      type="email"
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      placeholder="friend@example.com"
                      required
                      className="w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-[#f7d302] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      placeholder="Flappy Pixel High Score Challenge!"
                      required
                      className="w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-[#f7d302] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/60">
                      Message Body
                    </label>
                    <textarea
                      rows={7}
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                      placeholder="Write your email message here..."
                      className="w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-xs sm:text-sm text-white placeholder:text-white/30 focus:border-[#f7d302] focus:outline-none font-sans"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={requestDraftConfirmation}
                      className="flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/15 cursor-pointer"
                    >
                      <FileText className="size-3.5" />
                      <span>SAVE DRAFT</span>
                    </button>

                    <button
                      type="submit"
                      id="btn-gmail-send-submit"
                      className="flex items-center gap-1.5 rounded-lg border-2 border-black bg-[#ea4335] px-4 py-2 text-xs sm:text-sm font-black text-white shadow-[0_3px_0_#000] hover:bg-[#f25548] cursor-pointer"
                    >
                      <Send className="size-3.5" />
                      <span>SEND VIA GMAIL</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}

        {/* Mandatory Explicit Confirmation Dialog for Any Mutating / Destructive Gmail Action */}
        {pendingMutation && (
          <div
            id="gmail-confirm-overlay"
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md rounded-2xl border-3 border-[#f7d302] bg-[#141414] p-4 sm:p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-2.5 text-[#f7d302]">
                <AlertTriangle className="size-5 shrink-0" />
                <h3 className="text-sm sm:text-base font-black uppercase">
                  {pendingMutation.kind === 'send'
                    ? 'Confirm Send Email?'
                    : pendingMutation.kind === 'draft'
                    ? 'Confirm Save Gmail Draft?'
                    : pendingMutation.kind === 'trash'
                    ? 'Confirm Move Email to Trash?'
                    : pendingMutation.markAsRead
                    ? 'Confirm Mark Email as Read?'
                    : 'Confirm Mark Email as Unread?'}
                </h3>
              </div>

              <div className="rounded-xl border border-white/15 bg-black/70 p-3 text-xs text-white/80 space-y-1.5">
                {pendingMutation.kind === 'send' && (
                  <>
                    <p>
                      You are about to send an email from your Gmail account:
                    </p>
                    <p>
                      <span className="text-white/50">To: </span>
                      <span className="font-bold text-white">{pendingMutation.to}</span>
                    </p>
                    <p>
                      <span className="text-white/50">Subject: </span>
                      <span className="font-bold text-[#f7d302]">{pendingMutation.subject}</span>
                    </p>
                    <p className="text-[11px] text-white/60 line-clamp-3 border-t border-white/10 pt-1.5">
                      {pendingMutation.body || '(No message body)'}
                    </p>
                  </>
                )}

                {pendingMutation.kind === 'draft' && (
                  <>
                    <p>Save this message as a draft in your Gmail account?</p>
                    {pendingMutation.to && (
                      <p>
                        <span className="text-white/50">To: </span>
                        <span className="font-bold text-white">{pendingMutation.to}</span>
                      </p>
                    )}
                    <p>
                      <span className="text-white/50">Subject: </span>
                      <span className="font-bold text-[#f7d302]">{pendingMutation.subject}</span>
                    </p>
                  </>
                )}

                {pendingMutation.kind === 'trash' && (
                  <>
                    <p>Move this email to your Gmail Trash folder?</p>
                    <p>
                      <span className="text-white/50">From: </span>
                      <span className="font-bold text-white">{pendingMutation.message.from}</span>
                    </p>
                    <p>
                      <span className="text-white/50">Subject: </span>
                      <span className="font-bold text-[#ef4444]">
                        {pendingMutation.message.subject}
                      </span>
                    </p>
                  </>
                )}

                {pendingMutation.kind === 'toggleRead' && (
                  <>
                    <p>
                      Update label on email{' '}
                      <strong className="text-white">"{pendingMutation.message.subject}"</strong> to{' '}
                      <strong className="text-[#4ec0ca]">
                        {pendingMutation.markAsRead ? 'READ' : 'UNREAD'}
                      </strong>
                      ?
                    </p>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={mutating}
                  onClick={() => {
                    retroAudio.playSelect();
                    setPendingMutation(null);
                  }}
                  className="rounded-lg border border-white/25 bg-white/5 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/15 cursor-pointer disabled:opacity-50"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  id="btn-gmail-confirm-action"
                  disabled={mutating}
                  onClick={executePendingMutation}
                  className={`flex items-center gap-1.5 rounded-lg border-2 border-black px-4 py-2 text-xs font-black cursor-pointer disabled:opacity-50 ${
                    pendingMutation.kind === 'trash'
                      ? 'bg-[#ef4444] text-white hover:bg-red-500'
                      : 'bg-[#f7d302] text-black hover:bg-[#ffe338]'
                  }`}
                >
                  {mutating && <Loader2 className="size-3.5 animate-spin" />}
                  <span>
                    {pendingMutation.kind === 'send'
                      ? 'CONFIRM & SEND'
                      : pendingMutation.kind === 'draft'
                      ? 'CONFIRM SAVE'
                      : pendingMutation.kind === 'trash'
                      ? 'CONFIRM TRASH'
                      : 'CONFIRM UPDATE'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
