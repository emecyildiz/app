import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import recommendationService from '../services/recommendationService';

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
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
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
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full rounded bg-white p-6">
          <Dialog.Title className="text-lg font-medium mb-4">
            Film Önerisi Gönder
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Kullanıcı Arama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kime önerilecek?
              </label>
              {!selectedUser ? (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Kullanıcı ara..."
                    className="w-full p-2 border rounded"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-48 overflow-auto">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedUser(user);
                            setSearchResults([]);
                            setSearchQuery('');
                          }}
                          className="w-full p-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                        >
                          {user.avatar && (
                            <img
                              src={user.avatar}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <span>{user.name || user.username}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 p-2 border rounded">
                  {selectedUser.avatar && (
                    <img
                      src={selectedUser.avatar}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span>{selectedUser.name || selectedUser.username}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="ml-auto text-sm text-red-600 hover:text-red-800"
                  >
                    Değiştir
                  </button>
                </div>
              )}
            </div>

            {/* Başlık */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Başlık
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Öneri başlığı"
              />
            </div>

            {/* Not */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Not (Opsiyonel)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-2 border rounded"
                rows="3"
                placeholder="Neden önerdiğinizi belirtebilirsiniz..."
              />
            </div>

            {/* Butonlar */}
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                disabled={isLoading}
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
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
