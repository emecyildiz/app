import { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { Navigate, useNavigate } from 'react-router-dom'
import { 
  UserGroupIcon, 
  UserPlusIcon, 
  CogIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const { user, getAllUsers, getAllOperators, addOperator, removeOperator, deleteUser } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddOperator, setShowAddOperator] = useState(false)
  const [operatorForm, setOperatorForm] = useState({
    email: '',
    password: '',
    name: '',
    username: ''
  })
  const [users, setUsers] = useState([])
  const [operators, setOperators] = useState([])
  const [loading, setLoading] = useState(true)

  // Redirect if not admin
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" />
  }

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [usersData, operatorsData] = await Promise.all([
          getAllUsers(),
          getAllOperators()
        ])
        console.log('Admin Dashboard - Users Data:', usersData)
        console.log('Admin Dashboard - Operators Data:', operatorsData)
        setUsers(usersData)
        setOperators(operatorsData)
      } catch (error) {
        console.error('Error loading admin data:', error)
        toast.error('Veriler yüklenirken hata oluştu!')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [getAllUsers, getAllOperators])

  const handleAddOperator = async (e) => {
    e.preventDefault()
    
    if (!operatorForm.email || !operatorForm.password || !operatorForm.name) {
      toast.error('Lütfen tüm alanları doldurun!')
      return
    }

    const result = await addOperator(operatorForm)
    if (result.success) {
      setOperatorForm({ email: '', password: '', name: '', username: '' })
      setShowAddOperator(false)
      // Reload data after adding operator
      const [usersData, operatorsData] = await Promise.all([
        getAllUsers(),
        getAllOperators()
      ])
      setUsers(usersData)
      setOperators(operatorsData)
      toast.success('Operatör başarıyla eklendi!')
    }
  }

  const handleRemoveOperator = async (operatorId) => {
    if (window.confirm('Bu operatörü kaldırmak istediğinizden emin misiniz?')) {
      const result = await removeOperator(operatorId)
      if (result.success) {
        // Reload data after removing operator
        const [usersData, operatorsData] = await Promise.all([
          getAllUsers(),
          getAllOperators()
        ])
        setUsers(usersData)
        setOperators(operatorsData)
        toast.success('Operatör başarıyla kaldırıldı!')
      }
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      const result = await deleteUser(userId)
      if (result.success) {
        // Reload data after deleting user
        const [usersData, operatorsData] = await Promise.all([
          getAllUsers(),
          getAllOperators()
        ])
        setUsers(usersData)
        setOperators(operatorsData)
        toast.success('Kullanıcı başarıyla silindi!')
      }
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Paneli</h1>
          <p className="text-gray-400">Sistem yönetimi ve kullanıcı kontrolü</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-white text-lg">Veriler yükleniyor...</div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Toplam Kullanıcı</p>
                    <p className="text-3xl font-bold text-white mt-1">{users.filter(u => u.role === 'USER').length}</p>
                  </div>
                  <UsersIcon className="w-12 h-12 text-red-600" />
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Operatörler</p>
                    <p className="text-3xl font-bold text-white mt-1">{operators.length}</p>
                  </div>
                  <ShieldCheckIcon className="w-12 h-12 text-blue-600" />
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Aktif Oturumlar</p>
                    <p className="text-3xl font-bold text-white mt-1">1</p>
                  </div>
                  <ChartBarIcon className="w-12 h-12 text-green-600" />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-800 mb-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'overview'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Genel Bakış
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'users'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Kullanıcılar
                </button>
                <button
                  onClick={() => setActiveTab('operators')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'operators'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Operatörler
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'settings'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  Ayarlar
                </button>
              </nav>
            </div>

            {/* Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-xl font-semibold text-white mb-4">Sistem Özeti</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Sistem Durumu</p>
                      <p className="text-green-500 font-medium">Aktif</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Son Giriş</p>
                      <p className="text-white font-medium">{new Date().toLocaleString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Admin E-posta</p>
                      <p className="text-white font-medium">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Sistem Versiyonu</p>
                      <p className="text-white font-medium">v1.0.0</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-lg border border-gray-800">
                  <div className="p-6 border-b border-gray-800">
                    <h2 className="text-xl font-semibold text-white">Normal Kullanıcılar</h2>
                    <p className="text-gray-400 mt-1">Sadece USER rolündeki kullanıcıları görüntüle ve yönet</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left p-4 text-gray-400 font-medium">Kullanıcı</th>
                          <th className="text-left p-4 text-gray-400 font-medium">E-posta</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Rol</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Kayıt Tarihi</th>
                          <th className="text-left p-4 text-gray-400 font-medium">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(user => user.role === 'USER').length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-gray-400">
                              Henüz normal kullanıcı bulunamadı
                            </td>
                          </tr>
                        ) : (
                          users.filter(user => user.role === 'USER').map((user) => (
                            <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full"
                                  />
                                  <div>
                                    <p className="text-white font-medium">{user.name}</p>
                                    <p className="text-gray-400 text-sm">@{user.username}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-gray-300">{user.email}</td>
                              <td className="p-4">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-400">
                                  Kullanıcı
                                </span>
                              </td>
                              <td className="p-4 text-gray-300">
                                {new Date(user.memberSince).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => navigate(`/admin/user/${user.id}`)}
                                    className="text-blue-500 hover:text-blue-400 text-sm"
                                  >
                                    Düzenle
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-red-500 hover:text-red-400 text-sm"
                                  >
                                    Sil
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'operators' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">Operatör Yönetimi</h2>
                  <button
                    onClick={() => setShowAddOperator(!showAddOperator)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <UserPlusIcon className="w-5 h-5" />
                    Operatör Ekle
                  </button>
                </div>

                {showAddOperator && (
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                    <h3 className="text-lg font-semibold text-white mb-4">Yeni Operatör Ekle</h3>
                    <form onSubmit={handleAddOperator} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Ad Soyad
                          </label>
                          <input
                            type="text"
                            value={operatorForm.name}
                            onChange={(e) => setOperatorForm({ ...operatorForm, name: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Kullanıcı Adı
                          </label>
                          <input
                            type="text"
                            value={operatorForm.username}
                            onChange={(e) => setOperatorForm({ ...operatorForm, username: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            E-posta
                          </label>
                          <input
                            type="email"
                            value={operatorForm.email}
                            onChange={(e) => setOperatorForm({ ...operatorForm, email: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-2">
                            Şifre
                          </label>
                          <input
                            type="password"
                            value={operatorForm.password}
                            onChange={(e) => setOperatorForm({ ...operatorForm, password: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowAddOperator(false)}
                          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          Ekle
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="bg-gray-900 rounded-lg border border-gray-800">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left p-4 text-gray-400 font-medium">Operatör</th>
                          <th className="text-left p-4 text-gray-400 font-medium">E-posta</th>
                          <th className="text-left p-4 text-gray-400 font-medium">Kayıt Tarihi</th>
                          <th className="text-left p-4 text-gray-400 font-medium">İşlemler</th>
                        </tr>
                      </thead>
                      <tbody>
                        {operators.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="p-8 text-center text-gray-400">
                              Henüz operatör eklenmemiş
                            </td>
                          </tr>
                        ) : (
                          operators.map((operator) => (
                            <tr key={operator.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={operator.avatar}
                                    alt={operator.name}
                                    className="w-10 h-10 rounded-full"
                                  />
                                  <div>
                                    <p className="text-white font-medium">{operator.name}</p>
                                    <p className="text-gray-400 text-sm">@{operator.username}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-gray-300">{operator.email}</td>
                              <td className="p-4 text-gray-300">
                                {new Date(operator.memberSince).toLocaleDateString('tr-TR')}
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() => handleRemoveOperator(operator.id)}
                                  className="text-red-500 hover:text-red-400 text-sm"
                                >
                                  Kaldır
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                  <h2 className="text-xl font-semibold text-white mb-4">Sistem Ayarları</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Site Başlığı
                      </label>
                      <input
                        type="text"
                        defaultValue="Film Sitesi"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Site Açıklaması
                      </label>
                      <textarea
                        defaultValue="Film tutkunları için özel bir platform"
                        rows="3"
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Bakım Modu
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="maintenance"
                          className="w-4 h-4 text-red-600 bg-gray-800 border-gray-600 rounded focus:ring-red-600"
                        />
                        <label htmlFor="maintenance" className="text-gray-300">
                          Bakım modunu etkinleştir
                        </label>
                      </div>
                    </div>
                    <div className="pt-4">
                      <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                        Ayarları Kaydet
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}