import { useState, useEffect } from 'react';
import axios from 'axios';
import './Comments.css';

const Comments = ({ recipeId, userId }) => {
  const [comments, setComments] = useState([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComments = async () => {
    try {
      const res = await axios.get(`/api/recipes/${recipeId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

  const isLoggedIn = !!localStorage.getItem('token');

  const handleAdd = async () => {
    // Gate: open login modal if not authenticated
    if (!isLoggedIn) {
      window.dispatchEvent(new Event('open-login'));
      return;
    }
    if (!newText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(
        `/api/recipes/${recipeId}/comment`,
        { text: newText },
        { headers }
      );
      setComments(prev => [...prev, res.data.comment]);
      setNewText('');
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('open-login'));
      } else {
        console.error('Error adding comment:', err);
        setError(err.response?.data?.message || 'Could not add comment');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`/api/recipes/${recipeId}/comment/${commentId}`, { headers });
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete comment');
    }
  };

  return (
    <div className="comments-section-container">
      <h3 className="comments-section-title">Comments ({comments.length})</h3>
      
      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments-msg">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map(c => {
            const commentUserId = c.userId?._id || c.userId;
            const commentUsername = c.userId?.username || 'Anonymous Cook';
            const isOwner = userId && commentUserId && commentUserId.toString() === userId.toString();
            
            return (
              <div key={c._id} className="comment-card-item">
                <div className="comment-header-row">
                  <span className="comment-username-badge">
                    👤 {commentUsername}
                  </span>
                  <span className="comment-timestamp">
                    {new Date(c.date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="comment-body-content">
                  <p className="comment-text-paragraph">{c.text}</p>
                </div>
                {isOwner && (
                  <div className="comment-actions-row">
                    <button 
                      className="comment-delete-button" 
                      onClick={() => handleDelete(c._id)}
                      title="Delete comment"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div 
        className={`add-comment-form-wrapper ${!isLoggedIn ? 'logged-out' : ''}`}
        onClick={!isLoggedIn ? () => window.dispatchEvent(new Event('open-login')) : undefined}
        style={!isLoggedIn ? { cursor: 'pointer' } : {}}
      >
        <h4 className="add-comment-heading">Add a Comment</h4>
        <textarea
          className="add-comment-textarea"
          rows="3"
          value={newText}
          onChange={isLoggedIn ? e => setNewText(e.target.value) : undefined}
          placeholder={isLoggedIn ? "Write your comment here..." : "Log in to share your thoughts..."}
          disabled={loading}
          readOnly={!isLoggedIn}
          style={!isLoggedIn ? { cursor: 'pointer' } : {}}
        />
        <div className="add-comment-actions">
          <button 
            onClick={isLoggedIn ? handleAdd : undefined} 
            disabled={loading || (isLoggedIn && !newText.trim())} 
            className="comment-submit-btn"
            style={!isLoggedIn ? { cursor: 'pointer' } : {}}
          >
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
        {error && <p className="comment-error-alert">{error}</p>}
      </div>
    </div>
  );
};

export default Comments;
