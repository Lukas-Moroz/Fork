import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, MapPin, X, ChevronRight, Search, Mail, Link as LinkIcon, Send, UserMinus } from 'lucide-react';
import { useFork } from '../context/ForkContext';
import InviteByEmailSheet from '../components/fork/InviteByEmailSheet';
import { isValidEmail } from '../utils/validate';

export default function FriendsScreen() {
  const navigate = useNavigate();
  const { friends, pendingRequests, acceptRequest, declineRequest, removeFriend, places, sendFriendRequest } = useFork();
  const [confirmUnfriend, setConfirmUnfriend] = useState(null);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');
  const [inviteEmailOpen, setInviteEmailOpen] = useState(false);
  const [findEmail, setFindEmail] = useState('');
  const [findStatus, setFindStatus] = useState(null); // null | 'sending' | 'sent' | 'error'

  const handleFindSend = async () => {
    if (!isValidEmail(findEmail)) return;
    setFindStatus('sending');
    try {
      await sendFriendRequest(findEmail.trim());
      setFindStatus('sent');
      setTimeout(() => { setFindStatus(null); setFindEmail(''); }, 2500);
    } catch {
      setFindStatus('error');
      setTimeout(() => setFindStatus(null), 3000);
    }
  };

  const filteredFriends = useMemo(() =>
    friends.filter(f => f.name.toLowerCase().includes(search.toLowerCase())),
    [friends, search]
  );

  const handleInvite = () => {
    navigator.clipboard.writeText(window.location.origin).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[calc(100dvh-56px)] bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-2xl font-extrabold">Friends</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Share food finds with your crew</p>
      </div>

      {/* Invite Buttons */}
      <div className="px-4 mb-5 flex gap-2">
        <button
          onClick={() => setInviteEmailOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-all"
        >
          <Mail className="w-4 h-4" />
          Invite by email
        </button>
        <button
          onClick={handleInvite}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-muted text-muted-foreground rounded-xl font-semibold text-sm active:scale-[0.98] transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4" />}
        </button>
      </div>

      {/* Find by email */}
      <div className="px-4 mb-5">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Find by email</h2>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="email"
              placeholder="friend@email.com"
              value={findEmail}
              onChange={e => setFindEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFindSend()}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <button
            onClick={handleFindSend}
            disabled={!findEmail.trim() || findStatus === 'sending' || findStatus === 'sent'}
            className={`px-4 rounded-xl font-semibold text-sm flex items-center gap-1.5 disabled:opacity-50 transition-all ${
              findStatus === 'sent' ? 'bg-green-500 text-white'
              : findStatus === 'error' ? 'bg-destructive text-destructive-foreground'
              : 'bg-primary text-primary-foreground'
            }`}
          >
            {findStatus === 'sent' ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {findStatus === 'sent' ? 'Sent!' : findStatus === 'error' ? 'Failed' : 'Add'}
          </button>
        </div>
        {findStatus === 'sent' && <p className="text-xs text-green-600 font-medium mt-1.5 px-1">Friend request sent!</p>}
        {findStatus === 'error' && <p className="text-xs text-destructive font-medium mt-1.5 px-1">Failed to send request. Try again.</p>}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="px-4 mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Pending requests
          </h2>
          <div className="space-y-2">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50">
                <img src={req.avatar} alt={req.name} className="w-11 h-11 rounded-full object-cover" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{req.name}</p>
                  <p className="text-xs text-muted-foreground">Wants to connect</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptRequest(req.id)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declineRequest(req.id)}
                    className="p-1.5 rounded-lg bg-muted text-muted-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search friends */}
      {friends.length > 2 && (
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search friends..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
      )}

      {/* My Friends */}
      <div className="px-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          My friends · {friends.length}
        </h2>
        {friends.length === 0 ? (
          <div className="text-center py-10 text-sm text-muted-foreground">
            <p className="text-2xl mb-2">🍴</p>
            <p className="font-semibold">No friends yet</p>
            <p className="text-xs mt-1">Invite someone above to get started</p>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">No friends match "{search}"</div>
        ) : (
          <div className="space-y-2">
            {filteredFriends.map(friend => {
              const friendPins = places.filter(p =>
                p.savedBy !== 'me' && (
                  p.savedBy?.toLowerCase() === friend.name.toLowerCase() ||
                  p.created_by === friend.email
                )
              );
              const visitedByFriend = friendPins.filter(p => p.visited).length;
              return (
                <div
                  key={friend.id}
                  onClick={() => navigate(`/friend/${encodeURIComponent(friend.name)}`)}
                  className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/50 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="relative">
                    <img src={friend.avatar} alt={friend.name} className="w-11 h-11 rounded-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{friend.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <MapPin className="w-3 h-3 text-friend-pin" />
                      <span className="text-xs text-muted-foreground">{friendPins.length} pins</span>
                      {visitedByFriend > 0 && (
                        <>
                          <span className="text-muted-foreground text-[10px]">·</span>
                          <span className="text-[10px] text-green-600 font-medium">{visitedByFriend} visited</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {confirmUnfriend === friend.id ? (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); removeFriend(friend.id); setConfirmUnfriend(null); }}
                          className="text-[10px] text-destructive font-bold px-2 py-1 bg-destructive/10 rounded-lg"
                        >
                          Unfriend
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmUnfriend(null); }}
                          className="text-[10px] text-muted-foreground font-medium px-2 py-1"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <button
                          onClick={e => { e.stopPropagation(); setConfirmUnfriend(friend.id); }}
                          className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors ml-1"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <InviteByEmailSheet open={inviteEmailOpen} onClose={() => setInviteEmailOpen(false)} />
    </div>
  );
}