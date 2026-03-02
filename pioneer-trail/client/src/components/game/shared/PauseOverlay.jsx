export default function PauseOverlay() {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md">
        <h2 className="text-3xl font-bold text-trail-darkBrown mb-4">Game Paused</h2>
        <p className="text-trail-brown text-lg">
          Your teacher has paused the session. Please wait for them to resume.
        </p>
        <div className="mt-6 animate-pulse">
          <div className="w-12 h-12 mx-auto rounded-full bg-trail-blue/20 flex items-center justify-center">
            <div className="w-4 h-4 rounded-full bg-trail-blue" />
          </div>
        </div>
      </div>
    </div>
  );
}
