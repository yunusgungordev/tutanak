return (
  <div className="flex h-full">
    {/* Sol taraftaki tab listesi */}
    <div className="w-60 border-r bg-background">
      {/* Tab listesi içeriği */}
    </div>

    {/* Sağ taraftaki içerik alanı */}
    <div className="flex-1 relative overflow-hidden">
      {/* Aktif tab içeriği */}
      <div className="absolute inset-0">
        {activeTab && <activeTab.component label={activeTab.label} />}
      </div>
    </div>
  </div>
); 