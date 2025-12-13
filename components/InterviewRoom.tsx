import React from "react";
import Avatar from "./Avatar";
import UserCam, { UserCamHandle } from "./UserCam";

interface AudioVisualizerProps {
  volume: number; // 0 - 255
  isActive: boolean;
}


interface InterviewRoomProps extends AudioVisualizerProps {
  userCamRef?: React.RefObject<UserCamHandle>;
  aiSpeaking?: boolean;
  userSpeaking?: boolean;
  onAvatarLoaded?: () => void;
}

const InterviewView: React.FC<InterviewRoomProps> = ({ volume, isActive, userCamRef, aiSpeaking, userSpeaking, onAvatarLoaded }) => {
  return (
    <div className="h-full w-full flex flex-col p-6">
      
      {/* Meet style panel */}
      <div className="flex grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
        
        {/*  AI Avatar */}
        <div className={`relative bg-gradient-to-br from-primary/20 to-secondary/10
          ${aiSpeaking ? 'border-2 border-primary' : 'border border-primary/30'} rounded-2xl shadow-xl overflow-hidden
          backdrop-blur-sm flex items-center justify-center aspect-[4/3]'`}>
          <Avatar volume={volume} isActive={isActive} onLoaded={onAvatarLoaded} />
          <div className="pointer-events-none absolute top-0 left-0 w-full h-10 
      bg-gradient-to-b from-black/40 to-transparent" />

      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-10
      bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute top-3 left-3 px-3 py-1 bg-black/40 rounded text-white text-xs">
            AI Interviewer
          </div>
        </div>

        {/* User Camera */}
        <div className={`relative bg-gradient-to-br from-secondary/20 to-primary/10
          ${userSpeaking ? 'border-2 border-primary' : 'border border-secondary/30'} rounded-2xl shadow-xl overflow-hidden
          backdrop-blur-sm flex items-center justify-center aspect-[4/3]`}>
          <UserCam ref={userCamRef as any} />
          <div className="absolute top-3 left-3 px-3 py-1 bg-black/40 rounded text-white text-xs">
            Kamu
          </div>
        </div>

      </div>
    </div>
  );
};

export default InterviewView;
