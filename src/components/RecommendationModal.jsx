import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import recommendationService from '../services/recommendationService';
import { userService } from '../services/userService';
import { tmdbService } from '../services/tmdbService';

export default function RecommendationModal({ isOpen, onClose, movie, onSuccess, toUserId, toUser }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [movieQuery, setMovieQuery] = useState('');
  const [movieResults, setMovieResults] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const isMultiMovieMode = !movie;

  useEffect(() => {
    if (!isOpen) return;
    if (movie) {
      setTitle(`${movie.title} is worth watching`);
    } else {
      setTitle((prev) => prev || 'Movie recommendation');
    }
    if (toUserId && toUser) {
      setSelectedUser({ id: toUserId, ...toUser });
    }
  }, [isOpen, movie, toUserId, toUser]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const data = await userService.searchFriends(query, 10);
      setSearchResults(data);
    } catch (error) {
      console.error('User search failed:', error);
      toast.error('Friends could not be searched.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const recipientId = toUserId || selectedUser?.id;
    if (!recipientId) {
      toast.error('Please select a user.');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a title.');
      return;
    }
    let movies = [];
    if (isMultiMovieMode) {
      if (selectedMovies.length === 0) {
        toast.error('Please select at least one movie.');
        return;
      }
      movies = selectedMovies;
    } else {
      movies = [movie];
    }

    setIsLoading(true);
    try {
      await recommendationService.createRecommendation(
        recipientId,
        title,
        note,
        movies
      );
      toast.success('Recommendation sent.');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Recommendation failed:', error);
      const errorMessages = {
        recommendations_require_friendship: 'Recommendations can only be sent to accepted friends.',
        duplicate_recent_recommendation: 'You already recommended one of these movies to this friend in the last 24 hours.',
        daily_recommendation_limit_reached: 'You have reached the daily recommendation limit.',
        too_many_recommendations: 'Too many recommendations were sent. Please wait a few minutes.',
        payload_too_large: 'The recommendation contains too much data. Reload the page and try again.',
      };
      toast.error(errorMessages[error?.code] || error?.message || 'The recommendation could not be sent.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedUser(null);
    setTitle('');
    setNote('');
    setSearchResults([]);
    setMovieQuery('');
    setMovieResults([]);
    setSelectedMovies([]);
    onClose();
  };

  const handleMovieSearch = async (query) => {
    setMovieQuery(query);
    if (query.trim().length < 2) {
      setMovieResults([]);
      return;
    }
    try {
      const res = await tmdbService.searchMovies(query, 1);
      setMovieResults(res?.results || []);
    } catch (err) {
      console.error('Movie search failed:', err);
      toast.error('Movies could not be searched.');
    }
  };

  const addMovie = (m) => {
    if (selectedMovies.find((x) => x.id === m.id)) return;
    if (selectedMovies.length >= 3) {
      toast.error('You can select up to three movies.');
      return;
    }
    setSelectedMovies((prev) => [...prev, m]);
  };

  const removeMovie = (id) => {
    setSelectedMovies((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full glass rounded-xl p-6">
          <Dialog.Title className="text-lg font-semibold text-white mb-4">
            Send a movie recommendation
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Recipient */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Who should receive it?
              </label>
              {toUserId ? (
                <div className="flex items-center gap-2 p-2 border border-white/10 rounded bg-white/5">
                  {toUser?.avatar ? (
                    <img src={toUser.avatar} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">@</div>
                  )}
                  <span className="text-white">{toUser?.name || toUser?.username || 'Selected user'}</span>
                </div>
              ) : (
                !selectedUser ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search your friends..."
                      className="input w-full"
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-dark-800 border border-white/10 rounded-lg shadow-xl max-h-56 overflow-auto">
                        {searchResults.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              setSelectedUser(user);
                              setSearchResults([]);
                              setSearchQuery('');
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-2 text-white"
                          >
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">@</div>
                            )}
                            <span className="truncate">{user.name || user.username}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 border border-white/10 rounded bg-white/5">
                    {selectedUser.avatar ? (
                      <img src={selectedUser.avatar} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">@</div>
                    )}
                    <span className="text-white">{selectedUser.name || selectedUser.username}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="ml-auto text-sm text-red-400 hover:text-red-300"
                    >
                      Change
                    </button>
                  </div>
                )
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input w-full"
                placeholder="Recommendation title"
                maxLength={200}
              />
            </div>

            {/* Movie selection */}
            {isMultiMovieMode && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Which films?
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={movieQuery}
                    onChange={(e) => handleMovieSearch(e.target.value)}
                    placeholder="Search films..."
                    className="input w-full"
                  />
                  {movieResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-dark-800 border border-white/10 rounded-lg shadow-xl max-h-72 overflow-auto">
                      {movieResults.slice(0, 10).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => addMovie(m)}
                          className="w-full px-3 py-2 text-left hover:bg-white/10 flex items-center gap-3 text-white"
                        >
                          {m.poster_path ? (
                            <img src={tmdbService.getImageURL(m.poster_path, 'w92')} alt="" className="w-8 h-12 rounded-sm object-cover" />
                          ) : (
                            <div className="w-8 h-12 rounded-sm bg-white/10" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="truncate">{m.title}</div>
                            {m.release_date && (
                              <div className="text-xs text-gray-400">{new Date(m.release_date).getFullYear()}</div>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">Add</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedMovies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedMovies.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 px-2 py-1 bg-white/10 rounded-full text-white text-sm">
                        <span className="truncate max-w-[180px]">{m.title}</span>
                        <button type="button" onClick={() => removeMovie(m.id)} className="text-red-300 hover:text-red-200">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-400">You can select up to three movies.</div>
              </div>
            )}

            {/* Optional note */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input w-full"
                rows="3"
                placeholder="Add an optional note..."
                maxLength={2000}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary btn-sm"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm disabled:opacity-50"
                disabled={
                  isLoading ||
                  !(toUserId || selectedUser) ||
                  !title.trim() ||
                  (isMultiMovieMode && selectedMovies.length === 0)
                }
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
