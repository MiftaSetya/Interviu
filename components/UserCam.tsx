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
          videoRef.current.play().catch(() => {});
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
        try { videoRef.current.pause(); } catch (e) {}
        try { videoRef.current.srcObject = null; } catch (e) {}
        try { videoRef.current.removeAttribute('src'); } catch (e) {}
        try { videoRef.current.load(); } catch (e) {}
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
          try { videoRef.current.pause(); } catch (e) {}
          try { videoRef.current.srcObject = null; } catch (e) {}
          try { videoRef.current.removeAttribute('src'); } catch (e) {}
          try { videoRef.current.load(); } catch (e) {}
        }
      } catch (e) {
        // ignore
      }
    }
  }));

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover rounded-xl"
      autoPlay
      muted
    />
  );
});

export default UserCam;
