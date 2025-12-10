import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";

export type UserCamHandle = {
  stopCamera: () => void;
};

const UserCam = forwardRef<UserCamHandle>((_, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(
      (stream) => {
        if (!mounted) return;
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => { });
        }
      }
    ).catch(() => {
      // ignore
    });

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        try { videoRef.current.pause(); } catch (e) { }
        try { videoRef.current.srcObject = null; } catch (e) { }
        try { videoRef.current.removeAttribute('src'); } catch (e) { }
        try { videoRef.current.load(); } catch (e) { }
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    stopCamera: () => {
      try {
        const s = streamRef.current;
        if (s) {
          s.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          try { videoRef.current.pause(); } catch (e) { }
          try { videoRef.current.srcObject = null; } catch (e) { }
          try { videoRef.current.removeAttribute('src'); } catch (e) { }
          try { videoRef.current.load(); } catch (e) { }
        }
      } catch (e) {
        // ignore
      }
    }
  }));

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
      />

      <div className="absolute top-5 left-5 text-white font-semibold rounded-md backdrop-blur-md">
        Kamera anda
      </div>

      <div className="pointer-events-none absolute top-0 left-0 w-full h-10 
      bg-gradient-to-b from-black/40 to-transparent" />

      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-10
      bg-gradient-to-t from-black/40 to-transparent" />
    </div>
  );
});

export default UserCam;
