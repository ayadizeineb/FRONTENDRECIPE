import { useState } from 'react';
import axios from 'axios';
import './Rating.css';

const Rating = ({ recipeId, userId, initialRatings = [], initialAverage = 0, onRateChange }) => {
  const [average, setAverage] = useState(initialAverage);
  const [ratings, setRatings] = useState(initialRatings);
  const [hoverValue, setHoverValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rateError, setRateError] = useState(null);

  const token = localStorage.getItem('token') || '';
  const isLoggedIn = !!token;

  // Find if the current user has already rated this recipe
  const userRatingObj = userId
    ? ratings.find(r => {
        if (!r.user) return false;
        const rUserId = typeof r.user === 'object'
          ? (r.user._id || r.user).toString()
          : String(r.user);
        return rUserId === String(userId);
      })
    : null;
  const userRatingValue = userRatingObj ? userRatingObj.value : null;

  const handleRate = async (val) => {
    if (!isLoggedIn) {
      window.dispatchEvent(new Event('open-login'));
      return;
    }
    setLoading(true);
    setRateError(null);
    try {
      const tok = localStorage.getItem('token') || '';
      const res = await axios.post(
        `/api/recipes/${recipeId}/rate`,
        { value: val },
        { headers: { Authorization: `Bearer ${tok}` } }
      );
      setAverage(res.data.averageRating);
      setRatings(res.data.ratings);
      if (onRateChange) onRateChange(res.data.averageRating, res.data.ratings);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('open-login'));
      } else {
        const msg = err.response?.data?.message || 'Could not save rating. Try again.';
        setRateError(msg);
        setTimeout(() => setRateError(null), 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  const rounded = Math.round(average);
  const displayValue = hoverValue !== null
    ? hoverValue
    : (userRatingValue !== null ? userRatingValue : rounded);

  return (
    <div className="rating-component">
      <div className="stars-wrapper">
        {[1, 2, 3, 4, 5].map((starVal) => (
          <span
            key={starVal}
            className={`star-symbol ${starVal <= displayValue ? 'filled' : ''} interactive ${loading ? 'disabled' : ''} ${userRatingValue ? 'user-rated' : ''}`}
            onMouseEnter={() => !loading && setHoverValue(starVal)}
            onMouseLeave={() => !loading && setHoverValue(null)}
            onClick={() => !loading && handleRate(starVal)}
            title={
              isLoggedIn
                ? (userRatingValue
                    ? `Your rating: ${userRatingValue} ★ — click to change`
                    : `Rate ${starVal} star${starVal > 1 ? 's' : ''}`)
                : 'Log in to rate this recipe'
            }
          >
            ★
          </span>
        ))}
      </div>

      <span className="rating-stats-text">
        {average > 0 ? (
          <>
            <span className="rating-value-badge">{average.toFixed(1)}</span>
            <span className="rating-count">({ratings.length} {ratings.length === 1 ? 'rating' : 'ratings'})</span>
            {userRatingValue && (
              <span className="user-rating-value">Your: {userRatingValue} ★</span>
            )}
          </>
        ) : (
          <span className="no-ratings-text">No ratings yet</span>
        )}
      </span>

      {!isLoggedIn && (
        <span
          className="rating-login-prompt"
          onClick={() => window.dispatchEvent(new Event('open-login'))}
        >
          Log in to rate ↗
        </span>
      )}

      {rateError && (
        <span className="rating-error-msg">{rateError}</span>
      )}
    </div>
  );
};

export default Rating;
