
import React from 'react';

interface DisclaimerProps {
  onAccept: () => void;
}

const Disclaimer: React.FC<DisclaimerProps> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <div className="flex justify-center mb-6 text-indigo-500">
          <i className="fa-solid fa-shield-halved text-6xl"></i>
        </div>
        <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          RandomTalk Live
        </h1>
        <p className="text-slate-400 mb-6 text-sm leading-relaxed">
          Welcome to our anonymous community. By proceeding, you agree that:
        </p>
        <ul className="text-left text-slate-300 space-y-3 mb-8 text-sm">
          <li className="flex items-start">
            <i className="fa-solid fa-check text-green-500 mt-1 mr-3"></i>
            <span>You are 18 years of age or older.</span>
          </li>
          <li className="flex items-start">
            <i className="fa-solid fa-check text-green-500 mt-1 mr-3"></i>
            <span>You will respect other users and refrain from harassment.</span>
          </li>
          <li className="flex items-start">
            <i className="fa-solid fa-check text-green-500 mt-1 mr-3"></i>
            <span>Illegal activities are strictly prohibited.</span>
          </li>
          <li className="flex items-start">
            <i className="fa-solid fa-check text-green-500 mt-1 mr-3"></i>
            <span>Your location and IP may be logged for safety purposes.</span>
          </li>
        </ul>
        <button
          onClick={onAccept}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          I Agree, Start Chatting
        </button>
      </div>
    </div>
  );
};

export default Disclaimer;
