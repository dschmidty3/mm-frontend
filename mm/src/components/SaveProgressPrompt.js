import React from 'react';

const SaveProgressPrompt = ({ isOpen, onClose, onSaveWithoutAccount }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-xl font-semibold mb-2">Save your progress</h3>
        <p className="text-slate-600 mb-4">You’re not signed in. Would you like to save your progress before continuing?</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
          <button onClick={onSaveWithoutAccount} className="px-4 py-2 rounded-md bg-blue-600 text-white">Save & Continue</button>
        </div>
      </div>
    </div>
  );
};

export default SaveProgressPrompt;
