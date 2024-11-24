const handleSave = async () => {
  try {
    const success = await saveDynamicTab({
      title,
      content,
      type: 'dynamic'
    });

    if (success) {
      onClose();
    } else {
      alert('Tab kaydedilirken bir hata oluştu');
    }
  } catch (error) {
    console.error('Tab kaydetme hatası:', error);
    alert('Tab kaydedilirken bir hata oluştu');
  }
} 