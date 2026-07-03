import { useState, useEffect } from 'react';
import axios from 'axios';
import './LikedBy.css';

// Generate a consistent color for a given username
const nameToColor = (name = '') => {
  const palette = [
    '#e07b54', '#6c8ebf', '#82b366', '#d6a935',
    '#9b59b6', '#e74c3c', '#1abc9c', '#e67e22',
    '#2980b9', '#c0392b', '#16a085', '#8e44ad',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

const Avatar = ({ username, size = 32 }) => {
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : '?';
  const bg = nameToColor(username);
  return (
    <div
      className="liked-by-avatar"
      title={username}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: bg,
      }}
    >
      {initials}
    </div>
  );
};

const LikedBy = ({ recipeId, likesCount, currentUserLiked }) => {
  const [likers, setLikers] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!recipeId) return;
    axios
      .get(`/api/recipes/${recipeId}/likers`)
      .then(res => setLikers(res.data || []))
      .catch(() => setLikers([]));
  }, [recipeId, likesCount]);

  if (likers.length === 0) return null;

  const MAX_AVATARS = 4;
  const shown = likers.slice(0, MAX_AVATARS);
  const overflow = likers.length - MAX_AVATARS;

  // Build the human-readable label
  const buildLabel = () => {
    if (likers.length === 1) return `${likers[0].username} liked this`;
    if (likers.length === 2)
      return `${likers[0].username} and ${likers[1].username} liked this`;
    const rest = likers.length - 1;
    return `${likers[0].username} and ${rest} other${rest > 1 ? 's' : ''} liked this`;
  };

  return (
    <div className="liked-by-wrapper">
      {/* Stacked avatars */}
      <div className="liked-by-avatars">
        {shown.map(u => (
          <Avatar key={u._id} username={u.username} />
        ))}
        {overflow > 0 && (
          <div
            className="liked-by-avatar liked-by-avatar--overflow"
            title={`${overflow} more`}
          >
            +{overflow}
          </div>
        )}
      </div>

      {/* Text summary */}
      <span
        className="liked-by-label"
        onClick={() => setShowAll(p => !p)}
        title="Click to see all"
      >
        {buildLabel()}
      </span>

      {/* Expanded dropdown list */}
      {showAll && (
        <div className="liked-by-dropdown">
          <p className="liked-by-dropdown-title">Liked by</p>
          {likers.map(u => (
            <div key={u._id} className="liked-by-dropdown-row">
              <Avatar username={u.username} size={28} />
              <span>{u.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LikedBy;
