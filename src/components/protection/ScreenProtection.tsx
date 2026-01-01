import { useEffect } from 'react';

export const useScreenProtection = () => {
  useEffect(() => {
    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Prevent keyboard shortcuts for screenshots and dev tools
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Print Screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+P (print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+S (screenshot in some browsers)
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+Shift+I (dev tools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return false;
      }

      // Prevent F12 (dev tools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+U (view source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        return false;
      }

      // Prevent Ctrl+S (save)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        return false;
      }
    };

    // Prevent drag and drop of images
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // Add blur overlay when tab loses focus (potential screen recording)
    const handleVisibilityChange = () => {
      const overlay = document.getElementById('screen-protection-overlay');
      if (document.hidden && overlay) {
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
      } else if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.pointerEvents = 'none';
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};

export const ScreenProtectionOverlay = () => {
  return (
    <div
      id="screen-protection-overlay"
      className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-xl flex items-center justify-center transition-opacity duration-300 pointer-events-none opacity-0"
    >
      <div className="text-center space-y-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold text-foreground">Conteúdo Protegido</h2>
        <p className="text-muted-foreground">
          Volte para a janela do aplicativo para continuar.
        </p>
      </div>
    </div>
  );
};

export const ScreenProtectionStyles = () => (
  <style>{`
    /* Prevent text selection */
    .protected-content {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    /* Prevent image dragging */
    .protected-content img {
      -webkit-user-drag: none;
      -khtml-user-drag: none;
      -moz-user-drag: none;
      -o-user-drag: none;
      user-drag: none;
      pointer-events: none;
    }

    /* Hide content when printing */
    @media print {
      body * {
        visibility: hidden !important;
      }
      body::after {
        content: "Impressão não permitida - Conteúdo protegido";
        visibility: visible;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-size: 24px;
        font-weight: bold;
      }
    }
  `}</style>
);
