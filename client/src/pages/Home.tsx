import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !loading) {
      setLocation("/thong-ke");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background image - Pokemon artwork */}
      <div className="absolute inset-0">
        <img
          src="/manus-storage/pokemon-login-bg_72a2127d.png"
          alt="Pokemon Trading"
          className="w-full h-full object-cover"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4 max-w-lg w-full">
        {/* Pokémon Logo Text */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="pokemon-logo-text text-6xl md:text-8xl tracking-wider drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            POKÉMON
          </h1>
          <p className="text-blue-200 text-sm md:text-base font-semibold tracking-widest uppercase drop-shadow-lg">
            Trading Manager
          </p>
        </div>

        {/* Login card */}
        <div className="w-full max-w-sm bg-black/60 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-8 shadow-2xl shadow-black/40 mt-4">
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-white">
                Chào mừng trở lại
              </h2>
              <p className="text-sm text-gray-300 mt-1">
                Đăng nhập để quản lý bộ sưu tập của bạn
              </p>
            </div>

            <Button
              onClick={() => startLogin()}
              size="lg"
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 transition-all duration-200 active:scale-[0.97]"
            >
              Đăng nhập
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Quản lý Card, Box, Pack - Theo dõi lợi nhuận
            </p>
          </div>
        </div>

        {/* Version */}
        <p className="text-xs text-white/50">
          Phiên bản 1.0.0
        </p>
      </div>
    </div>
  );
}
