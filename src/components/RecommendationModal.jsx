import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import recommendationService from '../services/recommendationService';
import { userService } from '../services/userService';

export default function RecommendationModal({ isOpen, onClose, movie, onSuccess }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (isOpen && movie) {
      setTitle(`${movie.title} filmini önermek istiyorum`);
    }
  }, [isOpen, movie]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const data = await userService.searchUsers(query, 10);
      setSearchResults(data);
    } catch (error) {
      console.error('Kullanıcı arama hatası:', error);
      toast.error('Kullanıcılar aranırken bir hata oluştu');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Lütfen bir kullanıcı seçin');
      return;
    }
    if (!title.trim()) {
      toast.error('Lütfen bir başlık girin');
      return;
    }

    setIsLoading(true);
    try {
      await recommendationService.createRecommendation(
        selectedUser.id,
        title,
        note,
        [movie.id]
      );
      toast.success('Öneri başarıyla gönderildi');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Öneri gönderme hatası:', error);
      toast.error('Öneri gönderilirken bir hata oluştu');
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
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full glass rounded-xl p-6">
          <Dialog.Title className="text-lg font-semibold text-white mb-4">
            Film Önerisi Gönder
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Kullanıcı Arama */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Kime önerilecek?
              </label>
              {!selectedUser ? (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Kullanıcı ara..."
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
                    Değiştir
                  </button>
                </div>
              )}
            </div>

            {/* Başlık */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Başlık
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input w-full"
                placeholder="Öneri başlığı"
              />
            </div>

            {/* Not */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Not (Opsiyonel)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input w-full"
                rows="3"
                placeholder="Neden önerdiğinizi belirtebilirsiniz..."
              />
            </div>

            {/* Butonlar */}
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-secondary btn-sm"
                disabled={isLoading}
              >
                İptal
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm disabled:opacity-50"
                disabled={isLoading || !selectedUser || !title.trim()}
              >
                {isLoading ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
