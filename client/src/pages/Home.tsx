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
      <div className="min-h-screen flex items-center justify-center bg-[#1a0a2e]">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Full background image - the Pokemon artwork */}
      <div className="absolute inset-0">
        <img
          src="/manus-storage/pokemon-login-bg_f461bbf3.png"
          alt="Pokemon Trading Manager"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Overlay content - positioned over the image */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between py-8">
        {/* Top area - POKÉMON logo replacing "Học Viện Bảo Bối" */}
        <div className="flex flex-col items-center mt-4">
          <h1 className="pokemon-logo-text text-7xl md:text-9xl tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] select-none">
            POKÉMON
          </h1>
          <p className="text-white/90 text-sm md:text-base font-bold tracking-[0.3em] uppercase mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Trading Manager
          </p>
        </div>

        {/* Bottom area - Login section (similar to original "Bắt đầu" button area) */}
        <div className="w-full max-w-md px-6 flex flex-col items-center gap-4 mb-8">
          {/* Server info bar (mimicking the original design) */}
          <div className="w-full bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-white/80 text-sm">Pokémon Trading Manager</span>
            <span className="text-yellow-400 text-sm font-semibold">v1.0</span>
          </div>

          {/* Login button (styled like the green "Bắt đầu" button) */}
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="w-full max-w-[200px] bg-gradient-to-b from-green-400 to-green-600 hover:from-green-300 hover:to-green-500 text-white font-bold text-lg shadow-lg shadow-green-900/40 border border-green-300/30 rounded-lg py-6 transition-all duration-150 active:scale-[0.97]"
          >
            Bắt đầu
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
