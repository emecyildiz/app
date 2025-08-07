// Mevcut users endpoint'i ekleyelim
app.get('/api/users/stats', async (req, res) => {
  try {
    // Kullanıcı sayısı
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('role', { count: 'exact' })
      .eq('role', 'user');

    // Operatör sayısı
    const { data: operators, error: operatorError } = await supabase
      .from('users')
      .select('role', { count: 'exact' })
      .eq('role', 'operator');

    if (userError || operatorError) {
      throw new Error(userError || operatorError);
    }

    res.json({
      success: true,
      data: {
        userCount: users.length,
        operatorCount: operators.length
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınırken bir hata oluştu'
    });
  }
});