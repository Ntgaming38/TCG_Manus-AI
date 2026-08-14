import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { readLoginBackgroundUrl } from "@/lib/loginBackground";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [transitioning, setTransitioning] = useState(false);
  const [backgroundUrl] = useState(() => readLoginBackgroundUrl(typeof window === "undefined" ? undefined : window.localStorage));

  useEffect(() => {
    if (user && !loading) {
      setLocation("/thong-ke");
    }
  }, [user, loading, setLocation]);

  const handleStart = useCallback(() => {
    // Trigger transition animation before login
    setTransitioning(true);
    // Wait for animation to complete, then start login
    setTimeout(() => {
      startLogin();
    }, 520);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full background image - artwork supplied by the user */}
      <div className="absolute inset-0">
        <img
          src={backgroundUrl}
          alt="Pikachu và Lucario trên nền đăng nhập TCG Manager"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/10 to-slate-950/70" />
      </div>

      {/* Transition overlay - follows the user's RGB palette when starting */}
      {transitioning && (
        <div className="absolute inset-0 z-50 login-rgb-transition-overlay flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-white" />
            <p className="text-white font-bold text-lg tracking-wider animate-pulse">
              Đang kết nối...
            </p>
          </div>
        </div>
      )}

      {/* Overlay content - positioned over the image */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-end py-8">
        {/* Bottom area - Logo is intentionally close to the version information */}
        <div className="w-full max-w-md px-6 flex flex-col items-center gap-4 mb-8 animate-slide-up">
          <div className="flex w-full flex-col items-center gap-1">
            <h1 className="tcg-logo-text login-tcg-logo whitespace-nowrap -translate-y-3 sm:-translate-y-4 text-[clamp(1.75rem,8vw,3.75rem)] tracking-[0.08em] select-none text-center leading-none">
              TCG Manager
            </h1>
            {/* Server info bar */}
          <div className="w-full bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-lg px-4 py-3 flex items-center justify-between shadow-[0_0_10px_rgba(255,203,5,0.1)]">
            <span className="text-white/80 text-sm">TCG Manager</span>
            <span className="text-yellow-400 text-sm font-semibold">v1.0</span>
          </div>
          </div>

          {/* Login button with pulse animation */}
          <Button
            onClick={handleStart}
            disabled={transitioning}
            size="lg"
            className="w-full max-w-[220px] red-btn text-xl rounded-lg py-7 border-0 btn-red-pulse disabled:opacity-70"
          >
            {transitioning ? (
              <><Loader2 className="h-5 w-5 animate-spin" /><span>Đang xử lý...</span></>
            ) : (
              "Bắt đầu"
            )}
          </Button>

          {/* Version text */}
          <p className="text-white/40 text-xs">
            Phiên bản: 1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
