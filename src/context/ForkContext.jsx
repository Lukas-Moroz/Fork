const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ForkContext = createContext();

const PENDING_REQUESTS = [];

const DEFAULT_PROFILE = {
  display_name: '',
  username: '',
  bio: '',
  location: '',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
  cuisine_prefs: [],
};

export function ForkProvider({ children }) {
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState(null);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(PENDING_REQUESTS);

  // Load current user & profile
  useEffect(() => {
    const init = async () => {
      try {
        setProfileLoading(true);
        const user = await db.auth.me();
        setCurrentUser(user);

        const profiles = await db.entities.UserProfile.filter({ user_email: user.email });
        if (profiles.length > 0) {
          setProfile(profiles[0]);
        } else {
          // Auto-create profile for new users
          const newProfile = await db.entities.UserProfile.create({
            user_email: user.email,
            display_name: user.full_name || 'Foodie',
            username: `@${(user.full_name || 'user').toLowerCase().replace(/\s+/g, '')}`,
            bio: 'Food explorer 🍜',
            location: '',
            avatar: DEFAULT_PROFILE.avatar,
            cuisine_prefs: [],
          });
          setProfile(newProfile);
        }

        // Load friends from Friendship entity
        const [sentFriendships, receivedFriendships] = await Promise.all([
          db.entities.Friendship.filter({ requester_email: user.email, status: 'accepted' }),
          db.entities.Friendship.filter({ recipient_email: user.email, status: 'accepted' }),
        ]);
        const friendEmails = [
          ...sentFriendships.map(f => f.recipient_email),
          ...receivedFriendships.map(f => f.requester_email),
        ];
        let resolvedFriendEmails = [];
        if (friendEmails.length > 0) {
          const friendProfiles = await Promise.all(
            friendEmails.map(email => db.entities.UserProfile.filter({ user_email: email }).then(r => r[0]).catch(() => null))
          );
          const validFriends = friendProfiles.filter(Boolean).map(fp => ({
            id: fp.id,
            name: fp.display_name || fp.username || fp.user_email,
            avatar: fp.avatar || DEFAULT_PROFILE.avatar,
            pinCount: 0,
            online: false,
            lastActive: null,
            email: fp.user_email,
          }));
          setFriends(validFriends);
          resolvedFriendEmails = validFriends.map(f => f.email);
        }

        // Load pending incoming requests
        const pending = await db.entities.Friendship.filter({ recipient_email: user.email, status: 'pending' });
        if (pending.length > 0) {
          const pendingProfiles = await Promise.all(
            pending.map(f => db.entities.UserProfile.filter({ user_email: f.requester_email }).then(r => r[0]).catch(() => null))
          );
          setPendingRequests(pendingProfiles.filter(Boolean).map((fp, i) => ({
            id: pending[i].id,
            friendshipId: pending[i].id,
            name: fp.display_name || fp.user_email,
            avatar: fp.avatar || DEFAULT_PROFILE.avatar,
            email: fp.user_email,
          })));
        }

        // Load places AFTER friends are known so we can filter correctly
        await loadPlaces(user, resolvedFriendEmails);
      } catch (err) {
        if (err.message && err.message.includes('not found in app')) {
          // Entity not registered yet — use defaults silently
        } else {
          setProfileError(err.message);
        }
      } finally {
        setProfileLoading(false);
      }
    };
    init();
  }, []);

  // Load places — only self + known friends
  const loadPlaces = useCallback(async (user, friendEmailsList) => {
    if (!user?.email) return;
    try {
      setPlacesLoading(true);
      setPlacesError(null);
      const allEmails = [user.email, ...(friendEmailsList || [])];
      // Fetch own places + each friend's places in parallel
      const results = await Promise.all(
        allEmails.map(email =>
          db.entities.Place.filter({ created_by: email }, '-created_date', 100).catch(() => [])
        )
      );
      // Merge and deduplicate by id
      const merged = {};
      results.flat().forEach(p => { merged[p.id] = p; });
      setPlaces(Object.values(merged));
    } catch (err) {
      if (err.message && err.message.includes('not found in app')) {
        setPlaces([]);
      } else {
        setPlacesError(err.message);
      }
    } finally {
      setPlacesLoading(false);
    }
  }, []);

  // Real-time subscription — only process events for current user or known friends
  useEffect(() => {
    const unsubscribe = db.entities.Place.subscribe((event) => {
      if (event.type === 'create') {
        setPlaces(prev => {
          if (prev.find(p => p.id === event.id)) return prev;
          // Only accept places from self or friends
          const friendEmails = friends.map(f => f.email);
          const isRelevant = !event.data.created_by ||
            event.data.created_by === currentUser?.email ||
            friendEmails.includes(event.data.created_by);
          if (!isRelevant) return prev;
          return [event.data, ...prev];
        });
      } else if (event.type === 'update') {
        // Only merge the changed fields to avoid overwriting optimistic state
        setPlaces(prev => prev.map(p => p.id === event.id ? { ...p, ...event.data } : p));
      } else if (event.type === 'delete') {
        setPlaces(prev => prev.filter(p => p.id !== event.id));
      }
    });
    return unsubscribe;
  }, [friends, currentUser?.email]);

  // Profile helpers — map entity fields to legacy shape consumed by UI
  const profileForUI = profile ? {
    name: profile.display_name || 'You',
    username: profile.username || '@you',
    bio: profile.bio || '',
    location: profile.location || '',
    avatar: profile.avatar || DEFAULT_PROFILE.avatar,
    cuisinePrefs: profile.cuisine_prefs || [],
  } : {
    name: 'You',
    username: '@you',
    bio: '',
    location: '',
    avatar: DEFAULT_PROFILE.avatar,
    cuisinePrefs: [],
  };

  const updateProfile = async (updates) => {
    if (!profile) return;
    // Map legacy UI field names → entity field names
    const entityUpdates = {};
    if (updates.name !== undefined) entityUpdates.display_name = updates.name;
    if (updates.username !== undefined) entityUpdates.username = updates.username;
    if (updates.bio !== undefined) entityUpdates.bio = updates.bio;
    if (updates.location !== undefined) entityUpdates.location = updates.location;
    if (updates.avatar !== undefined) entityUpdates.avatar = updates.avatar;
    if (updates.cuisinePrefs !== undefined) entityUpdates.cuisine_prefs = updates.cuisinePrefs;

    const updated = await db.entities.UserProfile.update(profile.id, entityUpdates);
    setProfile(updated);
  };

  // Place helpers — map entity shape to legacy UI shape
  const mapPlace = (p) => ({
    ...p,
    savedBy: p.created_by === currentUser?.email ? 'me' : (p.saved_by_name || p.created_by || 'Friend'),
    savedDate: p.created_date ? p.created_date.slice(0, 10) : '',
    // Ensure coords is always an array or null
    coords: Array.isArray(p.coords) && p.coords.length === 2 ? p.coords : null,
  });

  const placesForUI = places.map(mapPlace);

  const addPlace = async (place) => {
    // Optimistic: show immediately, then sync
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      ...place,
      id: tempId,
      saved_by_name: profileForUI.name,
      visited: place.visited ?? false,
      notes: place.notes || '',
    };
    setPlaces(prev => [optimistic, ...prev]);
    try {
      const created = await db.entities.Place.create({
        name: place.name,
        cuisine: place.cuisine,
        platform: place.platform,
        address: place.address,
        coords: place.coords,
        link: place.link,
        image: place.image,
        rating: place.rating || null,
        price_range: place.price_range || null,
        visited: false,
        notes: place.notes || '',
        saved_by_name: profileForUI.name,
      });
      setPlaces(prev => prev.map(p => p.id === tempId ? created : p));
      // Notify friends about the new pin
      if (friends.length > 0) {
        await Promise.all(friends.map(f =>
          db.entities.Notification.create({
            recipient_email: f.email,
            type: 'friend_pin',
            title: `${profileForUI.name} pinned ${place.name}`,
            body: place.cuisine ? `${place.cuisine} · ${place.address || ''}` : (place.address || ''),
            actor_name: profileForUI.name,
            actor_avatar: profileForUI.avatar,
            link: `/place/${created.id}`,
          }).catch(() => {})
        ));
      }
    } catch (err) {
      setPlaces(prev => prev.filter(p => p.id !== tempId));
    }
  };

  const updatePlace = async (id, updates) => {
    // Optimistic update — merge locally, don't overwrite with server response
    // (server response may not include all fields from optimistic state)
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    await db.entities.Place.update(id, updates).catch(() => {
      // Revert on error
      loadPlaces(currentUser, friends.map(f => f.email));
    });
  };

  const deletePlace = async (id) => {
    setPlaces(prev => prev.filter(p => p.id !== id));
    await db.entities.Place.delete(id).catch(() => {
      loadPlaces(currentUser, friends.map(f => f.email));
    });
  };

  const acceptRequest = async (id) => {
    const req = pendingRequests.find(r => r.id === id);
    if (!req) return;
    if (req.friendshipId) {
      await db.entities.Friendship.update(req.friendshipId, { status: 'accepted' }).catch(() => {});
    }
    // Add them to friends state immediately
    const newFriend = {
      id: req.id,
      name: req.name,
      avatar: req.avatar,
      pinCount: 0,
      online: false,
      lastActive: null,
      email: req.email,
    };
    setFriends(prev => {
      const updated = [...prev, newFriend];
      // Also load their places now that they're a friend
      loadPlaces(currentUser, updated.map(f => f.email));
      return updated;
    });
    // Notify the requester their request was accepted
    if (req.email) {
      db.entities.Notification.create({
        recipient_email: req.email,
        type: 'friend_request',
        title: `${profileForUI.name} accepted your request`,
        body: 'You are now friends on Fork 🍴',
        actor_name: profileForUI.name,
        actor_avatar: profileForUI.avatar,
      }).catch(() => {});
    }
    setPendingRequests(prev => prev.filter(r => r.id !== id));
  };

  const declineRequest = async (id) => {
    const req = pendingRequests.find(r => r.id === id);
    if (req?.friendshipId) {
      // Delete the friendship record entirely instead of leaving it as 'declined'
      await db.entities.Friendship.delete(req.friendshipId).catch(() => {});
    }
    setPendingRequests(prev => prev.filter(r => r.id !== id));
  };

  const removeFriend = async (friendId) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend || !currentUser?.email) return;
    // Remove from local state immediately
    setFriends(prev => prev.filter(f => f.id !== friendId));
    // Delete friendship records in both directions
    const [sent, received] = await Promise.all([
      db.entities.Friendship.filter({ requester_email: currentUser.email, recipient_email: friend.email }).catch(() => []),
      db.entities.Friendship.filter({ requester_email: friend.email, recipient_email: currentUser.email }).catch(() => []),
    ]);
    await Promise.all([...sent, ...received].map(f => db.entities.Friendship.delete(f.id).catch(() => {})));
  };

  const sendFriendRequest = async (recipientEmail) => {
    if (!currentUser?.email || recipientEmail === currentUser.email) return;
    // Check for existing friendship/request in both directions
    const [existing1, existing2] = await Promise.all([
      db.entities.Friendship.filter({ requester_email: currentUser.email, recipient_email: recipientEmail }),
      db.entities.Friendship.filter({ requester_email: recipientEmail, recipient_email: currentUser.email }),
    ]);
    if (existing1.length > 0 || existing2.length > 0) return;
    await db.entities.Friendship.create({
      requester_email: currentUser.email,
      recipient_email: recipientEmail,
      status: 'pending',
    });
    // Create a notification for the recipient
    await db.entities.Notification.create({
      recipient_email: recipientEmail,
      type: 'friend_request',
      title: `${profileForUI.name} wants to connect`,
      body: 'You have a new friend request on Fork 🍴',
      actor_name: profileForUI.name,
      actor_avatar: profileForUI.avatar,
    }).catch(() => {});
  };

  return (
    <ForkContext.Provider value={{
      places: placesForUI,
      placesLoading,
      placesError,
      friends,
      pendingRequests,
      profile: profileForUI,
      profileLoading,
      profileError,
      currentUser,
      addPlace,
      updatePlace,
      deletePlace,
      acceptRequest,
      declineRequest,
      removeFriend,
      updateProfile,
      sendFriendRequest,
      reloadPlaces: () => loadPlaces(currentUser, friends.map(f => f.email)),
    }}>
      {children}
    </ForkContext.Provider>
  );
}

export function useFork() {
  return useContext(ForkContext);
}