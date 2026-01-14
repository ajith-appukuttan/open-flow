import { useState, useRef, useEffect } from 'react';
import { LogOut, User, ChevronDown, LogIn, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function UserMenu() {
  const { user, isGuest, signOut, signInWithGoogle } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't render if neither authenticated user nor guest
  if (!user && !isGuest) return null;

  const displayName = isGuest ? 'Guest' : (user?.displayName || 'User');
  const email = isGuest ? 'Not signed in' : (user?.email || '');
  const photoURL = isGuest ? null : user?.photoURL;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            className="w-8 h-8 rounded-full border-2 border-indigo-400/50"
          />
        ) : isGuest ? (
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
            <UserCircle size={16} className="text-gray-300" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
        )}
        <span className="text-sm text-gray-300 hidden md:block max-w-[120px] truncate">
          {displayName}
        </span>
        {isGuest && (
          <span className="text-xs px-1.5 py-0.5 bg-gray-600 rounded text-gray-300 hidden md:block">
            Guest
          </span>
        )}
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-panel-bg border border-panel-border rounded-xl shadow-2xl overflow-hidden z-50">
          {/* User Info */}
          <div className="p-4 border-b border-panel-border">
            <div className="flex items-center gap-3">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-10 h-10 rounded-full"
                />
              ) : isGuest ? (
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                  <UserCircle size={20} className="text-gray-300" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{displayName}</p>
                <p className="text-xs text-gray-400 truncate">{email}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {isGuest ? (
              <>
                <button
                  onClick={async () => {
                    setIsOpen(false);
                    await signInWithGoogle();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <LogIn size={16} className="text-indigo-400" />
                  <span>Sign in with Google</span>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <LogOut size={16} className="text-gray-400" />
                  <span>Exit guest mode</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
              >
                <LogOut size={16} className="text-gray-400" />
                <span>Sign out</span>
              </button>
            )}
          </div>

          {/* Guest mode notice */}
          {isGuest && (
            <div className="px-4 py-3 bg-amber-500/10 border-t border-amber-500/20">
              <p className="text-xs text-amber-300">
                Your workflows are saved locally. Sign in to sync across devices.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
