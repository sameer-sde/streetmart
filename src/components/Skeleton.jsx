export function SkeletonCard() {
  return (
    <div className="skeleton-card fade-in">
      <div className="skeleton" style={{ height:155, borderRadius:"18px 18px 0 0" }} />
      <div style={{ padding:"12px 14px" }}>
        <div className="skeleton" style={{ height:16, width:"60%", marginBottom:8 }} />
        <div className="skeleton" style={{ height:12, width:"40%", marginBottom:12 }} />
        <div style={{ display:"flex", gap:8, marginBottom:12 }}>
          {[80,60,70,55].map((w,i) => (
            <div key={i} className="skeleton" style={{ height:28, width:w, borderRadius:10 }} />
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <div className="skeleton" style={{ height:36, flex:1, borderRadius:12 }} />
          <div className="skeleton" style={{ height:36, flex:1, borderRadius:12 }} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonPriceCard() {
  return (
    <div className="skeleton-card" style={{ minWidth:90, padding:"10px", flexShrink:0, borderRadius:16 }}>
      <div className="skeleton" style={{ width:54, height:54, borderRadius:12, margin:"0 auto 8px" }} />
      <div className="skeleton" style={{ height:11, width:"70%", margin:"0 auto 6px" }} />
      <div className="skeleton" style={{ height:14, width:"50%", margin:"0 auto" }} />
    </div>
  );
}

export function SkeletonHome() {
  return (
    <div style={{ padding:"14px" }} className="stagger">
      <div style={{ display:"flex", gap:10, marginBottom:14 }}>
        <div className="skeleton fade-in" style={{ flex:1, height:90, borderRadius:18 }} />
        <div className="skeleton fade-in" style={{ flex:1, height:90, borderRadius:18 }} />
      </div>
      <div style={{ display:"flex", gap:10, overflowX:"hidden", marginBottom:14 }}>
        {[1,2,3,4].map(i => <SkeletonPriceCard key={i} />)}
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
